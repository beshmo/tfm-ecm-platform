import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeVersion
} from "@ecmp/shared-types";

export interface ContentTypeSchemaReader {
  findLatestActiveByName(name: ContentTypeName): Promise<ContentTypeSchemaDefinition | null>;
  findByNameAndVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaDefinition | null>;
}
