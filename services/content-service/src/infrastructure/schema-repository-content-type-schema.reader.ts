import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeVersion
} from "@ecmp/shared-types";

import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";
import type { ContentTypeSchemaRepository } from "../domain/content-type-schema.repository";

/**
 * Reads content type schemas for content validation and CMIS type discovery
 * directly from the local Content Service schema repository, replacing the
 * previous HTTP dependency on the standalone Content Type Service.
 */
export class SchemaRepositoryContentTypeSchemaReader implements ContentTypeSchemaReader {
  constructor(private readonly repository: ContentTypeSchemaRepository) {}

  async listActive(): Promise<ContentTypeSchemaDefinition[]> {
    const summaries = await this.repository.listActive();
    const schemas = await Promise.all(
      summaries.map((summary) => this.repository.findByNameAndVersion(summary.name, summary.version))
    );

    return schemas
      .filter((record): record is NonNullable<typeof record> => record !== null)
      .map((record) => record.definition);
  }

  async findLatestActiveByName(
    name: ContentTypeName
  ): Promise<ContentTypeSchemaDefinition | null> {
    const record = await this.repository.findLatestActiveByName(name);

    return record ? record.definition : null;
  }

  async findByNameAndVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaDefinition | null> {
    const record = await this.repository.findByNameAndVersion(name, version);

    return record ? record.definition : null;
  }
}
