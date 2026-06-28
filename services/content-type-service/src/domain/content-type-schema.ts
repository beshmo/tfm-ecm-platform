import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";

export interface ContentTypeSchemaRecord {
  definition: ContentTypeSchemaDefinition;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt?: Date;
}

export function createContentTypeSchemaRecord(
  definition: ContentTypeSchemaDefinition,
  now: Date = new Date()
): ContentTypeSchemaRecord {
  return {
    definition,
    active: true,
    createdAt: now,
    updatedAt: now
  };
}

export function deactivateContentTypeSchemaRecord(
  record: ContentTypeSchemaRecord,
  now: Date = new Date()
): ContentTypeSchemaRecord {
  return {
    ...record,
    active: false,
    updatedAt: now,
    deactivatedAt: now
  };
}

export function toContentTypeSchemaSummary(
  record: ContentTypeSchemaRecord
): ContentTypeSchemaSummary {
  return {
    name: record.definition.name,
    version: record.definition.version,
    active: record.active
  };
}

export function compareContentTypeVersions(
  left: ContentTypeVersion,
  right: ContentTypeVersion
): number {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return 0;
}

export function contentTypeSchemaKey(
  name: ContentTypeName,
  version: ContentTypeVersion
): string {
  return `${name}:${version}`;
}
