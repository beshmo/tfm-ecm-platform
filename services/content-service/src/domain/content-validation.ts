import type {
  ContentFieldType,
  ContentTypeSchemaDefinition,
  ContentValidationError,
  ContentValidationErrorCode,
  ContentValidationResult
} from "@ecmp/shared-types";

const FORBIDDEN_FIELD_NAMES = new Set(["__proto__", "prototype", "constructor"]);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
// Timezone-aware RFC 3339 timestamp requiring an explicit `Z` or numeric offset.
const DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

export function validateContentInstanceData(
  schema: ContentTypeSchemaDefinition,
  data: unknown
): ContentValidationResult {
  if (!isPlainObject(data)) {
    return {
      valid: false,
      errors: [
        {
          field: "$",
          code: "INVALID_CONTENT_DATA",
          message: "Content data must be a plain object."
        }
      ]
    };
  }

  const errors: ContentValidationError[] = [];
  const fieldNames = Object.keys(data);
  const fieldsByName = new Map(schema.fields.map((field) => [field.name, field]));

  for (const fieldName of fieldNames) {
    if (FORBIDDEN_FIELD_NAMES.has(fieldName)) {
      errors.push(
        buildError(
          fieldName,
          "FORBIDDEN_FIELD_NAME",
          `${fieldName} is not an allowed field name.`
        )
      );
      continue;
    }

    if (!fieldsByName.has(fieldName)) {
      errors.push(
        buildError(
          fieldName,
          "UNKNOWN_FIELD",
          `${fieldName} is not defined by content type ${schema.name}.`
        )
      );
    }
  }

  for (const fieldDefinition of schema.fields) {
    const fieldName = fieldDefinition.name;
    const valueExists = Object.prototype.hasOwnProperty.call(data, fieldName);
    const value = data[fieldName];

    if (fieldDefinition.required && (!valueExists || value === null || value === undefined)) {
      errors.push(
        buildError(fieldName, "REQUIRED_FIELD_MISSING", `${fieldName} is required.`)
      );
      continue;
    }

    if (!valueExists) {
      continue;
    }

    if (value === null || value === undefined) {
      errors.push(
        buildTypeError(fieldName, fieldDefinition.type)
      );
      continue;
    }

    const typeError = validateFieldValue(fieldName, fieldDefinition.type, value);

    if (typeError) {
      errors.push(typeError);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateFieldValue(
  fieldName: string,
  fieldType: ContentFieldType,
  value: unknown
): ContentValidationError | null {
  switch (fieldType) {
    case "string":
      return typeof value === "string" ? null : buildTypeError(fieldName, fieldType);
    case "integer":
      return typeof value === "number" && Number.isInteger(value)
        ? null
        : buildTypeError(fieldName, fieldType);
    case "date":
      return typeof value === "string" && isValidIsoDate(value)
        ? null
        : buildTypeError(fieldName, fieldType);
    case "time":
      return typeof value === "string" && TIME_PATTERN.test(value)
        ? null
        : buildTypeError(fieldName, fieldType);
    case "boolean":
      return typeof value === "boolean" ? null : buildTypeError(fieldName, fieldType);
    case "datetime":
      return typeof value === "string" && isValidTimezoneAwareDatetime(value)
        ? null
        : buildTypeError(fieldName, fieldType);
    case "decimal":
      return typeof value === "number" && Number.isFinite(value)
        ? null
        : buildTypeError(fieldName, fieldType);
    case "html":
      return typeof value === "string" ? null : buildTypeError(fieldName, fieldType);
    case "uri":
      return typeof value === "string" && isAbsoluteUri(value)
        ? null
        : buildTypeError(fieldName, fieldType);
  }
}

function buildTypeError(fieldName: string, fieldType: ContentFieldType): ContentValidationError {
  switch (fieldType) {
    case "string":
      return buildError(fieldName, "INVALID_STRING", `${fieldName} must be a string.`);
    case "integer":
      return buildError(fieldName, "INVALID_INTEGER", `${fieldName} must be a whole number.`);
    case "date":
      return buildError(
        fieldName,
        "INVALID_DATE",
        `${fieldName} must be a valid date using YYYY-MM-DD format.`
      );
    case "time":
      return buildError(
        fieldName,
        "INVALID_TIME",
        `${fieldName} must be a valid time using HH:mm:ss format.`
      );
    case "boolean":
      return buildError(fieldName, "INVALID_BOOLEAN", `${fieldName} must be a boolean.`);
    case "datetime":
      return buildError(
        fieldName,
        "INVALID_DATETIME",
        `${fieldName} must be a timestamp with an explicit timezone offset or Z designator.`
      );
    case "decimal":
      return buildError(fieldName, "INVALID_DECIMAL", `${fieldName} must be a finite number.`);
    case "html":
      return buildError(fieldName, "INVALID_HTML", `${fieldName} must be a string.`);
    case "uri":
      return buildError(fieldName, "INVALID_URI", `${fieldName} must be an absolute URI.`);
  }
}

function buildError(
  field: string,
  code: ContentValidationErrorCode,
  message: string
): ContentValidationError {
  return { field, code, message };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimezoneAwareDatetime(value: string): boolean {
  // Require an explicit timezone designator and a real calendar timestamp.
  return DATETIME_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

// A `uri` value must be a syntactically valid absolute URI. The platform URL
// parser accepts any absolute URI scheme (for example `http:`, `https:`,
// `ftp:`, or `mailto:`) and rejects scheme-less or relative references, which
// keeps the field type meaningfully stronger than a plain `string`.
function isAbsoluteUri(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
