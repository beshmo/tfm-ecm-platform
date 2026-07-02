import type {
  ContentTypeDefinition,
  ContentTypeDefinitionId,
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion,
  FolderId
} from "@ecmp/shared-types";
import { ECMP_CONTENT_TYPE_DEFINITION_ID } from "@ecmp/shared-types";

export interface ContentTypeSchemaRecord {
  definition: ContentTypeSchemaDefinition;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deactivatedAt?: Date;
}

/**
 * The folder-contained content type definition object. A definition groups all
 * schema versions sharing a content type name and carries the repository
 * location and identity used for administration.
 */
export interface ContentTypeDefinitionRecord {
  contentTypeDefinitionId: ContentTypeDefinitionId;
  folderId: FolderId;
  name: ContentTypeName;
  versions: ContentTypeSchemaSummary[];
  createdAt: Date;
  updatedAt: Date;
}

export function toContentTypeDefinition(
  record: ContentTypeDefinitionRecord
): ContentTypeDefinition {
  return {
    contentTypeDefinitionId: record.contentTypeDefinitionId,
    objectTypeId: ECMP_CONTENT_TYPE_DEFINITION_ID,
    folderId: record.folderId,
    name: record.name,
    versions: record.versions.map((version) => ({ ...version })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
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
