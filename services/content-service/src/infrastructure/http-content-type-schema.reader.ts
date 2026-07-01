import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";

import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";

export class HttpContentTypeSchemaReader implements ContentTypeSchemaReader {
  constructor(private readonly baseUrl: string = defaultContentTypeServiceUrl()) {}

  async listActive(): Promise<ContentTypeSchemaDefinition[]> {
    const response = await fetch(`${this.baseUrl}/api/management/content-types`);

    if (!response.ok) {
      throw new Error(`Content type service list request failed with status ${response.status}.`);
    }

    const summaries = (await response.json()) as ContentTypeSchemaSummary[];
    const activeSummaries = summaries.filter((summary) => summary.active);

    const schemas = await Promise.all(
      activeSummaries.map((summary) => this.findByNameAndVersion(summary.name, summary.version))
    );

    return schemas.filter((schema): schema is ContentTypeSchemaDefinition => schema !== null);
  }

  async findLatestActiveByName(
    name: ContentTypeName
  ): Promise<ContentTypeSchemaDefinition | null> {
    return this.fetchSchema(`${this.baseUrl}/api/management/content-types/${encodeURIComponent(name)}`);
  }

  async findByNameAndVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaDefinition | null> {
    return this.fetchSchema(
      `${this.baseUrl}/api/management/content-types/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`
    );
  }

  private async fetchSchema(url: string): Promise<ContentTypeSchemaDefinition | null> {
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Content type service request failed with status ${response.status}.`);
    }

    return (await response.json()) as ContentTypeSchemaDefinition;
  }
}

function defaultContentTypeServiceUrl(): string {
  return process.env["CONTENT_TYPE_SERVICE_URL"] ?? "http://localhost:3003";
}
