import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeVersion
} from "@ecmp/shared-types";

import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";

export class InMemoryContentTypeSchemaReader implements ContentTypeSchemaReader {
  private readonly schemas = new Map<string, ContentTypeSchemaDefinition>();

  constructor(schemas: ContentTypeSchemaDefinition[] = []) {
    for (const schema of schemas) {
      this.add(schema);
    }
  }

  add(schema: ContentTypeSchemaDefinition): void {
    this.schemas.set(schemaKey(schema.name, schema.version), cloneSchema(schema));
  }

  async listActive(): Promise<ContentTypeSchemaDefinition[]> {
    return [...this.schemas.values()]
      .sort((left, right) => {
        const nameDiff = left.name.localeCompare(right.name);

        return nameDiff === 0 ? compareVersions(right.version, left.version) : nameDiff;
      })
      .map(cloneSchema);
  }

  async findLatestActiveByName(
    name: ContentTypeName
  ): Promise<ContentTypeSchemaDefinition | null> {
    const matches = [...this.schemas.values()]
      .filter((schema) => schema.name === name)
      .sort((left, right) => compareVersions(right.version, left.version));

    return matches[0] ? cloneSchema(matches[0]) : null;
  }

  async findByNameAndVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaDefinition | null> {
    const schema = this.schemas.get(schemaKey(name, version));

    return schema ? cloneSchema(schema) : null;
  }
}

function schemaKey(name: ContentTypeName, version: ContentTypeVersion): string {
  return `${name}:${version}`;
}

function cloneSchema(schema: ContentTypeSchemaDefinition): ContentTypeSchemaDefinition {
  return {
    ...schema,
    fields: Object.fromEntries(
      Object.entries(schema.fields).map(([fieldName, definition]) => [
        fieldName,
        { ...definition }
      ])
    )
  };
}

function compareVersions(left: ContentTypeVersion, right: ContentTypeVersion): number {
  const leftSegments = left.split(".").map(Number);
  const rightSegments = right.split(".").map(Number);
  const maxLength = Math.max(leftSegments.length, rightSegments.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftSegment = leftSegments[index] ?? 0;
    const rightSegment = rightSegments[index] ?? 0;

    if (leftSegment !== rightSegment) {
      return leftSegment - rightSegment;
    }
  }

  return 0;
}
