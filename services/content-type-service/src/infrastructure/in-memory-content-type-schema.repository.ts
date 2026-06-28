import type {
  ContentTypeName,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";

import {
  compareContentTypeVersions,
  contentTypeSchemaKey,
  deactivateContentTypeSchemaRecord,
  toContentTypeSchemaSummary,
  type ContentTypeSchemaRecord
} from "../domain/content-type-schema";
import type { ContentTypeSchemaRepository } from "../domain/content-type-schema.repository";

export class InMemoryContentTypeSchemaRepository implements ContentTypeSchemaRepository {
  private readonly records = new Map<string, ContentTypeSchemaRecord>();

  async save(record: ContentTypeSchemaRecord): Promise<ContentTypeSchemaRecord> {
    const key = contentTypeSchemaKey(record.definition.name, record.definition.version);

    this.records.set(key, cloneRecord(record));
    return cloneRecord(record);
  }

  async replace(record: ContentTypeSchemaRecord): Promise<ContentTypeSchemaRecord> {
    const key = contentTypeSchemaKey(record.definition.name, record.definition.version);

    this.records.set(key, cloneRecord(record));
    return cloneRecord(record);
  }

  async findByNameAndVersion(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaRecord | null> {
    const record = this.records.get(contentTypeSchemaKey(name, version));

    return record ? cloneRecord(record) : null;
  }

  async findLatestActiveByName(name: ContentTypeName): Promise<ContentTypeSchemaRecord | null> {
    const activeRecords = Array.from(this.records.values())
      .filter((record) => record.definition.name === name && record.active)
      .sort((left, right) =>
        compareContentTypeVersions(right.definition.version, left.definition.version)
      );

    return activeRecords[0] ? cloneRecord(activeRecords[0]) : null;
  }

  async listActive(): Promise<ContentTypeSchemaSummary[]> {
    return Array.from(this.records.values())
      .filter((record) => record.active)
      .map(toContentTypeSchemaSummary)
      .sort((left, right) =>
        left.name === right.name
          ? compareContentTypeVersions(right.version, left.version)
          : left.name.localeCompare(right.name)
      );
  }

  async deactivate(
    name: ContentTypeName,
    version: ContentTypeVersion,
    deactivatedAt: Date = new Date()
  ): Promise<ContentTypeSchemaRecord | null> {
    const key = contentTypeSchemaKey(name, version);
    const record = this.records.get(key);

    if (!record) {
      return null;
    }

    const deactivated = deactivateContentTypeSchemaRecord(record, deactivatedAt);
    this.records.set(key, cloneRecord(deactivated));

    return cloneRecord(deactivated);
  }
}

function cloneRecord(record: ContentTypeSchemaRecord): ContentTypeSchemaRecord {
  return {
    ...record,
    definition: {
      ...record.definition,
      fields: Object.fromEntries(
        Object.entries(record.definition.fields).map(([fieldName, field]) => [
          fieldName,
          { ...field }
        ])
      )
    },
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    deactivatedAt: record.deactivatedAt ? new Date(record.deactivatedAt) : undefined
  };
}
