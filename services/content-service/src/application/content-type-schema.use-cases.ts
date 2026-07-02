import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion,
  FolderId
} from "@ecmp/shared-types";
import type { SchemaParser } from "@ecmp/shared-yaml";

import {
  createContentTypeSchemaRecord,
  type ContentTypeDefinitionRecord
} from "../domain/content-type-schema";
import {
  ContentTypeDefinitionNotFoundError,
  ContentTypeSchemaAlreadyExistsError,
  ContentTypeSchemaInactiveError,
  ContentTypeSchemaMismatchError,
  ContentTypeSchemaNotFoundError,
  SchemaFolderNotFoundError,
  SchemaNamespaceConflictError
} from "../domain/content-type-schema.errors";
import type { ContentTypeSchemaRepository } from "../domain/content-type-schema.repository";
import type { FolderRepository } from "../domain/folder.repository";
import { isSchemaNamespacePath } from "../domain/system-folder";

type Clock = () => Date;

export class CreateContentTypeSchemaUseCase {
  constructor(
    private readonly parser: SchemaParser,
    private readonly repository: ContentTypeSchemaRepository
  ) {}

  async execute(source: string, folderId?: FolderId): Promise<ContentTypeSchemaDefinition> {
    const definition = this.parser.parse(source);
    const existing = await this.repository.findByNameAndVersion(
      definition.name,
      definition.version
    );

    if (existing) {
      throw new ContentTypeSchemaAlreadyExistsError(definition.name, definition.version);
    }

    const stored = await this.repository.save(
      createContentTypeSchemaRecord(definition),
      folderId ? { folderId } : undefined
    );

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

export class ListContentTypeDefinitionsUseCase {
  constructor(private readonly repository: ContentTypeSchemaRepository) {}

  async execute(folderId?: FolderId): Promise<ContentTypeDefinitionRecord[]> {
    return folderId
      ? this.repository.listDefinitionsByFolderId(folderId)
      : this.repository.listDefinitions();
  }
}

export class MoveContentTypeDefinitionUseCase {
  constructor(
    private readonly repository: ContentTypeSchemaRepository,
    private readonly folderRepository: FolderRepository,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(
    name: ContentTypeName,
    targetFolderId: FolderId
  ): Promise<ContentTypeDefinitionRecord> {
    const definition = await this.repository.findDefinitionByName(name);

    if (!definition) {
      throw new ContentTypeDefinitionNotFoundError(name);
    }

    const target = await this.folderRepository.findById(targetFolderId);

    if (!target) {
      throw new SchemaFolderNotFoundError(targetFolderId);
    }

    if (!isSchemaNamespacePath(target.path)) {
      throw new SchemaNamespaceConflictError(targetFolderId);
    }

    const moved = await this.repository.moveDefinition(name, targetFolderId, this.clock());

    if (!moved) {
      throw new ContentTypeDefinitionNotFoundError(name);
    }

    return moved;
  }
}
