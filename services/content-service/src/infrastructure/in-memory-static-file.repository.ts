import { randomUUID } from "node:crypto";

import type { FolderId, StaticFileId } from "@ecmp/shared-types";

import type { StaticFileIdGenerator } from "../domain/static-file-id-generator";
import { cloneStaticFile, type StaticFileEntity } from "../domain/static-file";
import type { StaticFileRepository } from "../domain/static-file.repository";

export class InMemoryStaticFileRepository implements StaticFileRepository {
  private readonly files = new Map<StaticFileId, StaticFileEntity>();

  constructor(seedFiles: StaticFileEntity[] = []) {
    for (const file of seedFiles) {
      this.files.set(file.fileId, cloneStaticFile(file));
    }
  }

  async listByFolderId(folderId: FolderId): Promise<StaticFileEntity[]> {
    return this.sortedFiles().filter((file) => file.folderId === folderId);
  }

  async findById(fileId: StaticFileId): Promise<StaticFileEntity | null> {
    const file = this.files.get(fileId);

    return file ? cloneStaticFile(file) : null;
  }

  async save(file: StaticFileEntity): Promise<StaticFileEntity> {
    this.files.set(file.fileId, cloneStaticFile(file));

    return cloneStaticFile(file);
  }

  async replace(file: StaticFileEntity): Promise<StaticFileEntity> {
    this.files.set(file.fileId, cloneStaticFile(file));

    return cloneStaticFile(file);
  }

  async delete(fileId: StaticFileId): Promise<void> {
    this.files.delete(fileId);
  }

  async hasAssignedFiles(folderId: FolderId): Promise<boolean> {
    return Array.from(this.files.values()).some((file) => file.folderId === folderId);
  }

  private sortedFiles(): StaticFileEntity[] {
    return Array.from(this.files.values())
      .map(cloneStaticFile)
      .sort((left, right) => {
        const createdAtDiff = left.createdAt.getTime() - right.createdAt.getTime();

        return createdAtDiff === 0 ? left.fileId.localeCompare(right.fileId) : createdAtDiff;
      });
  }
}

export class CryptoStaticFileIdGenerator implements StaticFileIdGenerator {
  next(): StaticFileId {
    return `STF-${randomUUID()}`;
  }
}
