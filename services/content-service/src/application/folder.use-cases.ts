import type { FolderCreateInput, FolderId, FolderUpdateInput } from "@ecmp/shared-types";

import type { FolderContentReader } from "../domain/folder-content.reader";
import type { FolderIdGenerator } from "../domain/folder-id-generator";
import {
  applyRenamedAncestorPath,
  createFolderRecord,
  FolderNameValidationError,
  isRootFolderId,
  normalizeFolderName,
  renameFolderRecord,
  type FolderRecord
} from "../domain/folder";
import type { FolderRepository } from "../domain/folder.repository";
import {
  DuplicateFolderNameError,
  FolderNotEmptyError,
  FolderNotFoundError,
  InvalidFolderNameError,
  ParentFolderNotFoundError,
  RootFolderOperationNotAllowedError
} from "./folder.errors";

type Clock = () => Date;

export class ListFoldersUseCase {
  constructor(private readonly repository: FolderRepository) {}

  async execute(parentFolderId?: FolderId): Promise<FolderRecord[]> {
    if (parentFolderId) {
      const folders = await this.repository.listByParentFolderId(parentFolderId);

      return folders.sort((left, right) => left.name.localeCompare(right.name));
    }

    const folders = await this.repository.list();

    return folders.sort((left, right) => left.path.localeCompare(right.path));
  }
}

export class GetFolderUseCase {
  constructor(private readonly repository: FolderRepository) {}

  async execute(folderId: FolderId): Promise<FolderRecord> {
    const folder = await this.repository.findById(folderId);

    if (!folder) {
      throw new FolderNotFoundError(folderId);
    }

    return folder;
  }
}

export class CreateFolderUseCase {
  constructor(
    private readonly repository: FolderRepository,
    private readonly idGenerator: FolderIdGenerator,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(input: FolderCreateInput): Promise<FolderRecord> {
    const parent = await this.repository.findById(input.parentFolderId);

    if (!parent) {
      throw new ParentFolderNotFoundError(input.parentFolderId);
    }

    const name = normalizeApplicationFolderName(input.name);
    await ensureUniqueSiblingName(this.repository, input.parentFolderId, name);

    return this.repository.save(
      createFolderRecord({
        folderId: this.idGenerator.next(),
        name,
        parent,
        now: this.clock()
      })
    );
  }
}

export class RenameFolderUseCase {
  constructor(
    private readonly repository: FolderRepository,
    private readonly clock: Clock = () => new Date()
  ) {}

  async execute(folderId: FolderId, input: FolderUpdateInput): Promise<FolderRecord> {
    const folder = await this.repository.findById(folderId);

    if (!folder) {
      throw new FolderNotFoundError(folderId);
    }

    if (isRootFolderId(folder.folderId)) {
      throw new RootFolderOperationNotAllowedError("rename");
    }

    if (!folder.parentFolderId) {
      throw new ParentFolderNotFoundError(folder.folderId);
    }

    const parent = await this.repository.findById(folder.parentFolderId);

    if (!parent) {
      throw new ParentFolderNotFoundError(folder.parentFolderId);
    }

    const name = normalizeApplicationFolderName(input.name);
    await ensureUniqueSiblingName(this.repository, folder.parentFolderId, name, folder.folderId);

    const now = this.clock();
    const renamed = renameFolderRecord(folder, name, parent, now);
    const descendants = (await this.repository.list())
      .filter((candidate) => candidate.path.startsWith(`${folder.path}/`))
      .map((descendant) => applyRenamedAncestorPath(descendant, folder.path, renamed.path, now));

    await this.repository.replaceMany([renamed, ...descendants]);

    return renamed;
  }
}

export class DeleteFolderUseCase {
  constructor(
    private readonly repository: FolderRepository,
    private readonly contentReader: FolderContentReader
  ) {}

  async execute(folderId: FolderId): Promise<void> {
    const folder = await this.repository.findById(folderId);

    if (!folder) {
      throw new FolderNotFoundError(folderId);
    }

    if (isRootFolderId(folder.folderId)) {
      throw new RootFolderOperationNotAllowedError("delete");
    }

    const children = await this.repository.listByParentFolderId(folder.folderId);

    if (children.length > 0 || (await this.contentReader.hasAssignedContent(folder.folderId))) {
      throw new FolderNotEmptyError(folder.folderId);
    }

    await this.repository.delete(folder.folderId);
  }
}

function normalizeApplicationFolderName(name: string): string {
  try {
    return normalizeFolderName(name);
  } catch (error) {
    if (error instanceof FolderNameValidationError) {
      throw new InvalidFolderNameError(error.message);
    }

    throw error;
  }
}

async function ensureUniqueSiblingName(
  repository: FolderRepository,
  parentFolderId: FolderId,
  name: string,
  excludeFolderId?: FolderId
): Promise<void> {
  const duplicate = await repository.findByParentFolderIdAndName(
    parentFolderId,
    name,
    excludeFolderId
  );

  if (duplicate) {
    throw new DuplicateFolderNameError(parentFolderId, name);
  }
}
