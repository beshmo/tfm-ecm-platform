import type {
  ContentTypeName,
  ContentTypeSchemaSummary,
  ContentTypeVersion,
  FolderId
} from "@ecmp/shared-types";

import type {
  ContentTypeDefinitionRecord,
  ContentTypeSchemaRecord
} from "./content-type-schema";

export interface SaveContentTypeSchemaTarget {
  /**
   * Schema folder that a newly created content type definition is assigned to.
   * Ignored when a definition for the schema name already exists; existing
   * definitions keep their location and are relocated only via `moveDefinition`.
   */
  folderId?: FolderId;
}

export interface ContentTypeSchemaRepository {
  save(
    record: ContentTypeSchemaRecord,
    target?: SaveContentTypeSchemaTarget
  ): Promise<ContentTypeSchemaRecord>;
  replace(record: ContentTypeSchemaRecord): Promise<ContentTypeSchemaRecord>;
  findByNameAndVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaRecord | null>;
  findLatestActiveByName(name: ContentTypeName): Promise<ContentTypeSchemaRecord | null>;
  listActive(): Promise<ContentTypeSchemaSummary[]>;
  deactivate(
    name: ContentTypeName,
    version: ContentTypeVersion,
    deactivatedAt?: Date
  ): Promise<ContentTypeSchemaRecord | null>;

  // Definition-level (folder-contained repository object) operations.
  findDefinitionByName(name: ContentTypeName): Promise<ContentTypeDefinitionRecord | null>;
  listDefinitions(): Promise<ContentTypeDefinitionRecord[]>;
  listDefinitionsByFolderId(folderId: FolderId): Promise<ContentTypeDefinitionRecord[]>;
  hasDefinitionsInFolder(folderId: FolderId): Promise<boolean>;
  moveDefinition(
    name: ContentTypeName,
    targetFolderId: FolderId,
    now?: Date
  ): Promise<ContentTypeDefinitionRecord | null>;
}
