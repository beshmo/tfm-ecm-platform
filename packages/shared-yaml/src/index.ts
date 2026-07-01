import { isMap, isScalar, isSeq, parseDocument, type YAMLMap, type YAMLSeq } from "yaml";
import type {
  ContentFieldType,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaField
} from "@ecmp/shared-types";

export interface SchemaParser {
  parse(source: string): ContentTypeSchemaDefinition;
}

export interface StrictYamlSchemaParserOptions {
  maxSourceBytes?: number;
}

export class SchemaValidationError extends Error {
  constructor(readonly issues: string[]) {
    super("Content type schema is invalid.");
    this.name = "SchemaValidationError";
  }
}

export const DEFAULT_MAX_SCHEMA_SOURCE_BYTES = 64 * 1024;
const TOP_LEVEL_KEYS = new Set(["name", "version", "fields"]);
const FIELD_KEYS = new Set(["name", "type", "required"]);
const SUPPORTED_FIELD_TYPES = new Set<ContentFieldType>([
  "string",
  "integer",
  "date",
  "time"
]);
const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const FIELD_NAME_PATTERN = /^[a-z][a-zA-Z0-9]*$/;
const VERSION_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;
const RESERVED_CONTENT_TYPE_NAMES = new Set([
  "folder",
  "folders",
  "file",
  "files",
  "static-file",
  "static-files",
  "content-type",
  "content-types"
]);
const YAML_ANCHOR_OR_ALIAS_PATTERN = /(^|\s)[&*][A-Za-z0-9_-]+/;

export class StrictYamlSchemaParser implements SchemaParser {
  private readonly maxSourceBytes: number;

  constructor(options: StrictYamlSchemaParserOptions = {}) {
    this.maxSourceBytes = options.maxSourceBytes ?? DEFAULT_MAX_SCHEMA_SOURCE_BYTES;

    if (!Number.isSafeInteger(this.maxSourceBytes) || this.maxSourceBytes < 1) {
      throw new RangeError("maxSourceBytes must be a positive safe integer.");
    }
  }

  parse(source: string): ContentTypeSchemaDefinition {
    const issues: string[] = [];

    if (byteLength(source) > this.maxSourceBytes) {
      throw new SchemaValidationError(["Schema source exceeds the maximum allowed size."]);
    }

    if (YAML_ANCHOR_OR_ALIAS_PATTERN.test(source)) {
      throw new SchemaValidationError(["Schema source must not use YAML anchors or aliases."]);
    }

    const document = parseDocument(source, {
      keepSourceTokens: false,
      schema: "failsafe",
      uniqueKeys: true
    });

    if (document.errors.length > 0) {
      throw new SchemaValidationError(["Schema source must be valid YAML."]);
    }

    if (!isMap(document.contents)) {
      throw new SchemaValidationError(["Schema root must be a mapping."]);
    }

    const root = document.contents;
    const rawTopLevel = readMap(root, "schema", issues);
    const topLevelKeys = new Set(Object.keys(rawTopLevel));

    for (const key of topLevelKeys) {
      if (!TOP_LEVEL_KEYS.has(key)) {
        issues.push(`Unsupported top-level key '${key}'.`);
      }
    }

    const name = readRequiredString(rawTopLevel, "name", issues);
    const version = readRequiredString(rawTopLevel, "version", issues);
    const fieldsNode = rawTopLevel["fields"];

    validateContentTypeName(name, issues);
    validateVersion(version, issues);

    if (isMap(fieldsNode)) {
      issues.push("Schema fields must be an ordered sequence, not a mapping.");
    } else if (!isSeq(fieldsNode)) {
      issues.push("Schema fields must be an ordered sequence.");
    }

    const fields = isSeq(fieldsNode) ? readFields(fieldsNode, issues) : [];

    if (fields.length === 0 && !issues.some((issue) => issue.startsWith("Schema fields"))) {
      issues.push("Schema must define at least one field.");
    }

    if (issues.length > 0) {
      throw new SchemaValidationError(issues);
    }

    return {
      name,
      version,
      fields
    };
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function readFields(
  fieldsSeq: YAMLSeq<unknown>,
  issues: string[]
): ContentTypeSchemaField[] {
  const fields: ContentTypeSchemaField[] = [];
  const seenNames = new Set<string>();

  for (const item of fieldsSeq.items) {
    if (!isMap(item)) {
      issues.push("Each field entry must be a mapping.");
      continue;
    }

    const fieldEntry = readMap(item, "field entry", issues);

    for (const key of Object.keys(fieldEntry)) {
      if (!FIELD_KEYS.has(key)) {
        issues.push(`Unsupported key '${key}' in field entry.`);
      }
    }

    const fieldName = scalarToString(fieldEntry["name"]);

    if (!fieldName) {
      issues.push("Each field entry must define a non-empty name.");
      continue;
    }

    validateFieldName(fieldName, issues);

    if (seenNames.has(fieldName)) {
      issues.push(`Duplicate field name '${fieldName}'.`);
      continue;
    }

    seenNames.add(fieldName);

    const type = scalarToString(fieldEntry["type"]);
    const required = readOptionalBoolean(fieldEntry["required"], fieldName, issues);

    if (!type) {
      issues.push(`Field '${fieldName}' must define a type.`);
      continue;
    }

    if (!SUPPORTED_FIELD_TYPES.has(type as ContentFieldType)) {
      issues.push(`Field '${fieldName}' uses unsupported type '${type}'.`);
      continue;
    }

    fields.push({
      name: fieldName,
      type: type as ContentFieldType,
      required
    });
  }

  return fields;
}

function readMap(
  map: YAMLMap<unknown, unknown>,
  location: string,
  issues: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;

  for (const item of map.items) {
    const key = scalarToString(item.key);

    if (!key) {
      issues.push(`${location} keys must be non-empty scalar values.`);
      continue;
    }

    if (BLOCKED_KEYS.has(key)) {
      issues.push(`Blocked unsafe key '${key}'.`);
      continue;
    }

    result[key] = item.value;
  }

  return result;
}

function readRequiredString(
  source: Record<string, unknown>,
  key: string,
  issues: string[]
): string {
  const value = scalarToString(source[key]);

  if (!value) {
    issues.push(`Schema must define '${key}'.`);
  }

  return value;
}

function readOptionalBoolean(value: unknown, fieldName: string, issues: string[]): boolean {
  if (value === undefined) {
    return false;
  }

  const scalarValue = scalarToString(value);

  if (scalarValue === "true") {
    return true;
  }

  if (scalarValue === "false") {
    return false;
  }

  issues.push(`Field '${fieldName}' required value must be true or false.`);
  return false;
}

function scalarToString(value: unknown): string {
  if (!isScalar(value)) {
    return "";
  }

  const scalar = value as { value: unknown };
  return typeof scalar.value === "string" ? scalar.value.trim() : "";
}

function validateContentTypeName(name: string, issues: string[]): void {
  if (!name) {
    return;
  }

  if (!NAME_PATTERN.test(name)) {
    issues.push("Schema name must use lowercase letters, numbers, and hyphens.");
  }

  if (RESERVED_CONTENT_TYPE_NAMES.has(name)) {
    issues.push(`Schema name '${name}' is reserved for an internal platform type.`);
  }
}

function validateVersion(version: string, issues: string[]): void {
  if (version && !VERSION_PATTERN.test(version)) {
    issues.push("Schema version must use major.minor or major.minor.patch format.");
  }
}

function validateFieldName(fieldName: string, issues: string[]): void {
  if (BLOCKED_KEYS.has(fieldName)) {
    issues.push(`Blocked unsafe field name '${fieldName}'.`);
  }

  if (!FIELD_NAME_PATTERN.test(fieldName)) {
    issues.push(`Field name '${fieldName}' must be identifier-like.`);
  }
}
