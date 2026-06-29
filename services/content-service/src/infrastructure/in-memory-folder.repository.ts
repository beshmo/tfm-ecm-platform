import { randomUUID } from "node:crypto";

import type { FolderId } from "@ecmp/shared-types";

import type { FolderContentReader } from "../domain/folder-content.reader";
import type { FolderIdGenerator } from "../domain/folder-id-generator";
import { cloneFolderRecord, createRootFolder, type FolderRecord } from "../domain/folder";
import type { FolderRepository } from "../domain/folder.repository";

export class InMemoryFolderRepository implements FolderRepository {
  private readonly records = new Map<FolderId, FolderRecord>();

  constructor(seedFolders: FolderRecord[] = [createRootFolder()]) {
    for (const folder of seedFolders) {
      this.records.set(folder.folderId, cloneFolderRecord(folder));
    }
  }

  async list(): Promise<FolderRecord[]> {
    return Array.from(this.records.values()).map(cloneFolderRecord);
  }

  async listByParentFolderId(parentFolderId: FolderId): Promise<FolderRecord[]> {
    return Array.from(this.records.values())
      .filter((folder) => folder.parentFolderId === parentFolderId)
      .map(cloneFolderRecord);
  }

  async findById(folderId: FolderId): Promise<FolderRecord | null> {
    const folder = this.records.get(folderId);

    return folder ? cloneFolderRecord(folder) : null;
  }

  async findByParentFolderIdAndName(
    parentFolderId: FolderId,
    name: string,
    excludeFolderId?: FolderId
  ): Promise<FolderRecord | null> {
    const normalizedName = name.toLocaleLowerCase("en-US");
    const folder = Array.from(this.records.values()).find(
      (record) =>
        record.parentFolderId === parentFolderId &&
        record.folderId !== excludeFolderId &&
        record.name.toLocaleLowerCase("en-US") === normalizedName
    );

    return folder ? cloneFolderRecord(folder) : null;
  }

  async save(folder: FolderRecord): Promise<FolderRecord> {
    this.records.set(folder.folderId, cloneFolderRecord(folder));

    return cloneFolderRecord(folder);
  }

  async replace(folder: FolderRecord): Promise<FolderRecord> {
    this.records.set(folder.folderId, cloneFolderRecord(folder));

    return cloneFolderRecord(folder);
  }

  async replaceMany(folders: FolderRecord[]): Promise<FolderRecord[]> {
    for (const folder of folders) {
      this.records.set(folder.folderId, cloneFolderRecord(folder));
    }

    return folders.map(cloneFolderRecord);
  }

  async delete(folderId: FolderId): Promise<void> {
    this.records.delete(folderId);
  }
}

export class CryptoFolderIdGenerator implements FolderIdGenerator {
  next(): FolderId {
    return `FLD-${randomUUID()}`;
  }
}

export class EmptyFolderContentReader implements FolderContentReader {
  async hasAssignedContent(_folderId: FolderId): Promise<boolean> {
    return false;
  }
}
