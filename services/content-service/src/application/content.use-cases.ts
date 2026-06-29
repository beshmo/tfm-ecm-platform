import type {
  ContentCreateInput,
  ContentId,
  ContentPatchInput,
  ContentReplaceInput,
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeVersion,
  FolderId
} from "@ecmp/shared-types";

import { validateContentInstanceData } from "../domain/content-validation";
import type { ContentIdGenerator } from "../domain/content-id-generator";
import {
  ImmutableContentTypeError,
  createContentRecord,
  patchContentRecord,
  replaceContentRecord,
  type ContentRecordEntity
} from "../domain/content";
import type { ContentRepository } from "../domain/content.repository";
import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";
import type { FolderRepository } from "../domain/folder.repository";
import { ContentTypeSchemaNotFoundError } from "./content-validation.errors";
import {
  ContentFolderNotFoundError,
  ContentNotFoundError,
  InvalidContentDataError
} from "./content.errors";

type Clock = () => Date;

export class ListContentsUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(folderId?: FolderId): Promise<ContentRecordEntity[]> {
    return folderId ? this.repository.listByFolderId(folderId) : this.repository.list();
  }
}

export class GetContentUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(contentId: ContentId): Promise<ContentRecordEntity> {
    const content = await this.repository.findById(contentId);

    if (!content) {
      throw new ContentNotFoundError(contentId);
    }

    return content;
  }
}

export class CreateContentUseCase {
  constructor(
    private readonly repository: ContentRepository,
    private readonly folderRepository: FolderRepository,
    private readonly schemaReader: ContentTypeSchemaReader,
    private readonly idGenerator: ContentIdGenerator,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(input: ContentCreateInput): Promise<ContentRecordEntity> {
    await ensureFolderExists(this.folderRepository, input.folderId);
    const schema = await resolveSchema(
      this.schemaReader,
      input.contentType,
      input.schemaVersion
    );
    validateOrThrow(schema, input.data);

    return this.repository.save(
      createContentRecord({
        contentId: this.idGenerator.next(),
        folderId: input.folderId,
        contentType: input.contentType,
        schemaVersion: schema.version,
        data: input.data,
        now: this.clock()
      })
    );
  }
}

export class ReplaceContentUseCase {
  constructor(
    private readonly repository: ContentRepository,
    private readonly folderRepository: FolderRepository,
    private readonly schemaReader: ContentTypeSchemaReader,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(contentId: ContentId, input: ContentReplaceInput): Promise<ContentRecordEntity> {
    const content = await findContentOrThrow(this.repository, contentId);
    ensureContentTypeUnchanged(content.contentType, input.contentType);
    await ensureFolderExists(this.folderRepository, input.folderId);
    const schemaVersion = input.schemaVersion ?? content.schemaVersion;
    const schema = await resolveSchema(this.schemaReader, content.contentType, schemaVersion);
    validateOrThrow(schema, input.data);

    return this.repository.replace(
      replaceContentRecord(content, {
        contentType: input.contentType,
        folderId: input.folderId,
        schemaVersion: schema.version,
        data: input.data,
        now: this.clock()
      })
    );
  }
}

export class PatchContentUseCase {
  constructor(
    private readonly repository: ContentRepository,
    private readonly folderRepository: FolderRepository,
    private readonly schemaReader: ContentTypeSchemaReader,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(contentId: ContentId, input: ContentPatchInput): Promise<ContentRecordEntity> {
    const content = await findContentOrThrow(this.repository, contentId);
    ensureContentTypeUnchanged(content.contentType, input.contentType);
    const folderId = input.folderId ?? content.folderId;
    await ensureFolderExists(this.folderRepository, folderId);
    const schemaVersion = input.schemaVersion ?? content.schemaVersion;
    const data = input.data ? { ...content.data, ...input.data } : content.data;
    const schema = await resolveSchema(this.schemaReader, content.contentType, schemaVersion);
    validateOrThrow(schema, data);

    return this.repository.replace(
      patchContentRecord(content, {
        contentType: input.contentType,
        folderId,
        schemaVersion: schema.version,
        data: input.data,
        now: this.clock()
      })
    );
  }
}

export class DeleteContentUseCase {
  constructor(private readonly repository: ContentRepository) {}

  async execute(contentId: ContentId): Promise<void> {
    await findContentOrThrow(this.repository, contentId);
    await this.repository.delete(contentId);
  }
}

async function findContentOrThrow(
  repository: ContentRepository,
  contentId: ContentId
): Promise<ContentRecordEntity> {
  const content = await repository.findById(contentId);

  if (!content) {
    throw new ContentNotFoundError(contentId);
  }

  return content;
}

async function ensureFolderExists(
  repository: FolderRepository,
  folderId: FolderId
): Promise<void> {
  const folder = await repository.findById(folderId);

  if (!folder) {
    throw new ContentFolderNotFoundError(folderId);
  }
}

async function resolveSchema(
  schemaReader: ContentTypeSchemaReader,
  contentType: ContentTypeName,
  schemaVersion?: ContentTypeVersion
): Promise<ContentTypeSchemaDefinition> {
  const schema = schemaVersion
    ? await schemaReader.findByNameAndVersion(contentType, schemaVersion)
    : await schemaReader.findLatestActiveByName(contentType);

  if (!schema) {
    throw new ContentTypeSchemaNotFoundError(contentType, schemaVersion);
  }

  return schema;
}

function validateOrThrow(schema: ContentTypeSchemaDefinition, data: unknown): void {
  const result = validateContentInstanceData(schema, data);

  if (!result.valid) {
    throw new InvalidContentDataError(result.errors);
  }
}

function ensureContentTypeUnchanged(
  existingContentType: ContentTypeName,
  requestedContentType?: ContentTypeName
): void {
  if (requestedContentType && requestedContentType !== existingContentType) {
    throw new ImmutableContentTypeError(existingContentType, requestedContentType);
  }
}
