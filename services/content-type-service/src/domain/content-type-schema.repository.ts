import type {
  ContentTypeName,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";

import type { ContentTypeSchemaRecord } from "./content-type-schema";

export interface ContentTypeSchemaRepository {
  save(record: ContentTypeSchemaRecord): Promise<ContentTypeSchemaRecord>;
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
}
