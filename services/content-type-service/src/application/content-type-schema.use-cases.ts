import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";
import type { SchemaParser } from "@ecmp/shared-yaml";

import { createContentTypeSchemaRecord } from "../domain/content-type-schema";
import {
  ContentTypeSchemaAlreadyExistsError,
  ContentTypeSchemaInactiveError,
  ContentTypeSchemaMismatchError,
  ContentTypeSchemaNotFoundError
} from "../domain/content-type-schema.errors";
import type { ContentTypeSchemaRepository } from "../domain/content-type-schema.repository";

export class CreateContentTypeSchemaUseCase {
  constructor(
    private readonly parser: SchemaParser,
    private readonly repository: ContentTypeSchemaRepository
  ) {}

  async execute(source: string): Promise<ContentTypeSchemaDefinition> {
    const definition = this.parser.parse(source);
    const existing = await this.repository.findByNameAndVersion(
      definition.name,
      definition.version
    );

    if (existing) {
      throw new ContentTypeSchemaAlreadyExistsError(definition.name, definition.version);
    }

    const stored = await this.repository.save(createContentTypeSchemaRecord(definition));

    return stored.definition;
  }
}

export class ReplaceContentTypeSchemaVersionUseCase {
  constructor(
    private readonly parser: SchemaParser,
    private readonly repository: ContentTypeSchemaRepository
  ) {}

  async execute(
    name: ContentTypeName,
    version: ContentTypeVersion,
    source: string
  ): Promise<ContentTypeSchemaDefinition> {
    const existing = await this.repository.findByNameAndVersion(name, version);

    if (!existing) {
      throw new ContentTypeSchemaNotFoundError(name, version);
    }

    if (!existing.active) {
      throw new ContentTypeSchemaInactiveError(name, version);
    }

    const definition = this.parser.parse(source);

    if (definition.name !== name || definition.version !== version) {
      throw new ContentTypeSchemaMismatchError();
    }

    const stored = await this.repository.replace(
      createContentTypeSchemaRecord(definition, existing.createdAt)
    );

    return stored.definition;
  }
}

export class GetContentTypeSchemaUseCase {
  constructor(private readonly repository: ContentTypeSchemaRepository) {}

  async execute(name: ContentTypeName): Promise<ContentTypeSchemaDefinition> {
    const record = await this.repository.findLatestActiveByName(name);

    if (!record) {
      throw new ContentTypeSchemaNotFoundError(name);
    }

    return record.definition;
  }
}

export class GetContentTypeSchemaVersionUseCase {
  constructor(private readonly repository: ContentTypeSchemaRepository) {}

  async execute(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaDefinition> {
    const record = await this.repository.findByNameAndVersion(name, version);

    if (!record) {
      throw new ContentTypeSchemaNotFoundError(name, version);
    }

    return record.definition;
  }
}

export class ListContentTypeSchemasUseCase {
  constructor(private readonly repository: ContentTypeSchemaRepository) {}

  async execute(): Promise<ContentTypeSchemaSummary[]> {
    return this.repository.listActive();
  }
}

export class DeactivateContentTypeSchemaVersionUseCase {
  constructor(private readonly repository: ContentTypeSchemaRepository) {}

  async execute(
    name: ContentTypeName,
    version: ContentTypeVersion
  ): Promise<ContentTypeSchemaDefinition> {
    const deactivated = await this.repository.deactivate(name, version);

    if (!deactivated) {
      throw new ContentTypeSchemaNotFoundError(name, version);
    }

    return deactivated.definition;
  }
}
