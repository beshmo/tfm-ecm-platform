import { randomUUID } from "node:crypto";

import type {
  ContentTypeDefinitionId,
  ContentTypeName,
  ContentTypeSchemaSummary,
  ContentTypeVersion,
  FolderId
} from "@ecmp/shared-types";
import { SYSTEM_SCHEMAS_FOLDER_ID } from "@ecmp/shared-types";

import {
  compareContentTypeVersions,
  contentTypeSchemaKey,
  deactivateContentTypeSchemaRecord,
  toContentTypeSchemaSummary,
  type ContentTypeDefinitionRecord,
  type ContentTypeSchemaRecord
} from "../domain/content-type-schema";
import type { ContentTypeDefinitionIdGenerator } from "../domain/content-type-definition-id-generator";
import type {
  ContentTypeSchemaRepository,
  SaveContentTypeSchemaTarget
} from "../domain/content-type-schema.repository";

interface DefinitionMeta {
  contentTypeDefinitionId: ContentTypeDefinitionId;
  folderId: FolderId;
  name: ContentTypeName;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryContentTypeSchemaRepository implements ContentTypeSchemaRepository {
  private readonly records = new Map<string, ContentTypeSchemaRecord>();
  private readonly definitions = new Map<ContentTypeName, DefinitionMeta>();

  constructor(
    private readonly idGenerator: ContentTypeDefinitionIdGenerator = new CryptoContentTypeDefinitionIdGenerator()
  ) {}

  async save(
    record: ContentTypeSchemaRecord,
    target?: SaveContentTypeSchemaTarget
  ): Promise<ContentTypeSchemaRecord> {
    const key = contentTypeSchemaKey(record.definition.name, record.definition.version);

    this.records.set(key, cloneRecord(record));
    this.ensureDefinition(record, target?.folderId ?? SYSTEM_SCHEMAS_FOLDER_ID);

    return cloneRecord(record);
  }

  async replace(record: ContentTypeSchemaRecord): Promise<ContentTypeSchemaRecord> {
    const key = contentTypeSchemaKey(record.definition.name, record.definition.version);

    this.records.set(key, cloneRecord(record));
    this.touchDefinition(record.definition.name, record.updatedAt);

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
    this.touchDefinition(name, deactivatedAt);

    return cloneRecord(deactivated);
  }

  async findDefinitionByName(name: ContentTypeName): Promise<ContentTypeDefinitionRecord | null> {
    const meta = this.definitions.get(name);

    return meta ? this.buildDefinitionRecord(meta) : null;
  }

  async listDefinitions(): Promise<ContentTypeDefinitionRecord[]> {
    return Array.from(this.definitions.values())
      .map((meta) => this.buildDefinitionRecord(meta))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async listDefinitionsByFolderId(folderId: FolderId): Promise<ContentTypeDefinitionRecord[]> {
    return Array.from(this.definitions.values())
      .filter((meta) => meta.folderId === folderId)
      .map((meta) => this.buildDefinitionRecord(meta))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async hasDefinitionsInFolder(folderId: FolderId): Promise<boolean> {
    return Array.from(this.definitions.values()).some((meta) => meta.folderId === folderId);
  }

  async moveDefinition(
    name: ContentTypeName,
    targetFolderId: FolderId,
    now: Date = new Date()
  ): Promise<ContentTypeDefinitionRecord | null> {
    const meta = this.definitions.get(name);

    if (!meta) {
      return null;
    }

    meta.folderId = targetFolderId;
    meta.updatedAt = new Date(now);

    return this.buildDefinitionRecord(meta);
  }

  private ensureDefinition(record: ContentTypeSchemaRecord, folderId: FolderId): void {
    const existing = this.definitions.get(record.definition.name);

    if (existing) {
      if (record.updatedAt > existing.updatedAt) {
        existing.updatedAt = new Date(record.updatedAt);
      }

      return;
    }

    this.definitions.set(record.definition.name, {
      contentTypeDefinitionId: this.idGenerator.next(),
      folderId,
      name: record.definition.name,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt)
    });
  }

  private touchDefinition(name: ContentTypeName, now: Date): void {
    const meta = this.definitions.get(name);

    if (meta && now > meta.updatedAt) {
      meta.updatedAt = new Date(now);
    }
  }

  private buildDefinitionRecord(meta: DefinitionMeta): ContentTypeDefinitionRecord {
    const versions = Array.from(this.records.values())
      .filter((record) => record.definition.name === meta.name)
      .map(toContentTypeSchemaSummary)
      .sort((left, right) => compareContentTypeVersions(right.version, left.version));

    return {
      contentTypeDefinitionId: meta.contentTypeDefinitionId,
      folderId: meta.folderId,
      name: meta.name,
      versions,
      createdAt: new Date(meta.createdAt),
      updatedAt: new Date(meta.updatedAt)
    };
  }
}

export class CryptoContentTypeDefinitionIdGenerator implements ContentTypeDefinitionIdGenerator {
  next(): ContentTypeDefinitionId {
    return `CTD-${randomUUID()}`;
  }
}

function cloneRecord(record: ContentTypeSchemaRecord): ContentTypeSchemaRecord {
  return {
    ...record,
    definition: {
      ...record.definition,
      fields: record.definition.fields.map((field) => ({ ...field }))
    },
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    deactivatedAt: record.deactivatedAt ? new Date(record.deactivatedAt) : undefined
  };
}
