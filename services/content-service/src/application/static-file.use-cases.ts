import type { FolderId, StaticFileId, StaticFileUpdateInput } from "@ecmp/shared-types";

import type { FolderRepository } from "../domain/folder.repository";
import { isSystemNamespacePath } from "../domain/system-folder";
import {
  StaticFileNameValidationError,
  StaticFileTooLargeError,
  UnsupportedStaticFileMimeTypeError,
  createStaticFile,
  renameStaticFile,
  type StaticFileEntity
} from "../domain/static-file";
import type { StaticFileIdGenerator } from "../domain/static-file-id-generator";
import type { StaticFileRepository } from "../domain/static-file.repository";
import type { StaticFileStorage } from "../domain/static-file.storage";
import {
  InvalidStaticFileNameError,
  MissingStaticFileUploadError,
  StaticFileFolderNotFoundError,
  StaticFileNotFoundError,
  StaticFileStorageError,
  StaticFileSystemNamespaceError,
  StaticFileUploadTooLargeError,
  UnsupportedStaticFileUploadMimeTypeError
} from "./static-file.errors";

type Clock = () => Date;

export interface StaticFileUploadInput {
  folderId: FolderId;
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export class ListStaticFilesUseCase {
  constructor(private readonly repository: StaticFileRepository) {}

  async execute(folderId: FolderId): Promise<StaticFileEntity[]> {
    return this.repository.listByFolderId(folderId);
  }
}

export class GetStaticFileUseCase {
  constructor(private readonly repository: StaticFileRepository) {}

  async execute(fileId: StaticFileId): Promise<StaticFileEntity> {
    return findStaticFileOrThrow(this.repository, fileId);
  }
}

export class UploadStaticFileUseCase {
  constructor(
    private readonly repository: StaticFileRepository,
    private readonly folderRepository: FolderRepository,
    private readonly storage: StaticFileStorage,
    private readonly idGenerator: StaticFileIdGenerator,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(input: StaticFileUploadInput | null): Promise<StaticFileEntity> {
    if (!input || input.buffer.length === 0) {
      throw new MissingStaticFileUploadError();
    }

    await ensureFolderExists(this.folderRepository, input.folderId);

    const fileId = this.idGenerator.next();
    let path = "";

    try {
      const stored = await this.storage.save({
        fileId,
        filename: input.filename,
        mimeType: input.mimeType,
        buffer: input.buffer
      });
      path = stored.path;

      return await this.repository.save(
        createStaticFile({
          fileId,
          folderId: input.folderId,
          filename: input.filename,
          mimeType: input.mimeType,
          size: input.size,
          path,
          now: this.clock()
        })
      );
    } catch (error) {
      if (path) {
        await cleanupStoredFile(this.storage, path);
      }

      throw mapStaticFileDomainError(error);
    }
  }
}

export class RenameStaticFileUseCase {
  constructor(
    private readonly repository: StaticFileRepository,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(fileId: StaticFileId, input: StaticFileUpdateInput): Promise<StaticFileEntity> {
    const file = await findStaticFileOrThrow(this.repository, fileId);

    try {
      return await this.repository.replace(renameStaticFile(file, input.filename, this.clock()));
    } catch (error) {
      throw mapStaticFileDomainError(error);
    }
  }
}

export class DeleteStaticFileUseCase {
  constructor(
    private readonly repository: StaticFileRepository,
    private readonly storage: StaticFileStorage
  ) {}

  async execute(fileId: StaticFileId): Promise<void> {
    const file = await findStaticFileOrThrow(this.repository, fileId);

    try {
      await this.storage.delete(file.path);
      await this.repository.delete(file.fileId);
    } catch (error) {
      throw mapStaticFileStorageError(error);
    }
  }
}

async function findStaticFileOrThrow(
  repository: StaticFileRepository,
  fileId: StaticFileId
): Promise<StaticFileEntity> {
  const file = await repository.findById(fileId);

  if (!file) {
    throw new StaticFileNotFoundError(fileId);
  }

  return file;
}

async function ensureFolderExists(
  repository: FolderRepository,
  folderId: FolderId
): Promise<void> {
  const folder = await repository.findById(folderId);

  if (!folder) {
    throw new StaticFileFolderNotFoundError(folderId);
  }

  if (isSystemNamespacePath(folder.path)) {
    throw new StaticFileSystemNamespaceError(folderId);
  }
}

async function cleanupStoredFile(storage: StaticFileStorage, path: string): Promise<void> {
  try {
    await storage.delete(path);
  } catch {
    // Best-effort cleanup after a failed create should not hide the original error.
  }
}

function mapStaticFileDomainError(error: unknown): Error {
  if (error instanceof StaticFileNameValidationError) {
    return new InvalidStaticFileNameError(error.message);
  }

  if (error instanceof UnsupportedStaticFileMimeTypeError) {
    return new UnsupportedStaticFileUploadMimeTypeError(error.mimeType);
  }

  if (error instanceof StaticFileTooLargeError) {
    return new StaticFileUploadTooLargeError(error.size);
  }

  return mapStaticFileStorageError(error);
}

function mapStaticFileStorageError(error: unknown): Error {
  if (
    error instanceof StaticFileNotFoundError ||
    error instanceof StaticFileFolderNotFoundError ||
    error instanceof InvalidStaticFileNameError ||
    error instanceof MissingStaticFileUploadError ||
    error instanceof UnsupportedStaticFileUploadMimeTypeError ||
    error instanceof StaticFileUploadTooLargeError ||
    error instanceof StaticFileStorageError
  ) {
    return error;
  }

  return new StaticFileStorageError(error instanceof Error ? error.message : undefined);
}
