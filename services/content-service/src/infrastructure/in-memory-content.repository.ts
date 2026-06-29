import { randomUUID } from "node:crypto";

import type { ContentId, FolderId } from "@ecmp/shared-types";

import type { ContentIdGenerator } from "../domain/content-id-generator";
import { cloneContentRecord, type ContentRecordEntity } from "../domain/content";
import type { ContentRepository } from "../domain/content.repository";
import type { FolderContentReader } from "../domain/folder-content.reader";

export class InMemoryContentRepository implements ContentRepository, FolderContentReader {
  private readonly records = new Map<ContentId, ContentRecordEntity>();

  constructor(seedContents: ContentRecordEntity[] = []) {
    for (const content of seedContents) {
      this.records.set(content.contentId, cloneContentRecord(content));
    }
  }

  async list(): Promise<ContentRecordEntity[]> {
    return this.sortedRecords();
  }

  async listByFolderId(folderId: FolderId): Promise<ContentRecordEntity[]> {
    return this.sortedRecords().filter((content) => content.folderId === folderId);
  }

  async findById(contentId: ContentId): Promise<ContentRecordEntity | null> {
    const content = this.records.get(contentId);

    return content ? cloneContentRecord(content) : null;
  }

  async save(content: ContentRecordEntity): Promise<ContentRecordEntity> {
    this.records.set(content.contentId, cloneContentRecord(content));

    return cloneContentRecord(content);
  }

  async replace(content: ContentRecordEntity): Promise<ContentRecordEntity> {
    this.records.set(content.contentId, cloneContentRecord(content));

    return cloneContentRecord(content);
  }

  async delete(contentId: ContentId): Promise<void> {
    this.records.delete(contentId);
  }

  async hasAssignedContent(folderId: FolderId): Promise<boolean> {
    return Array.from(this.records.values()).some((content) => content.folderId === folderId);
  }

  private sortedRecords(): ContentRecordEntity[] {
    return Array.from(this.records.values())
      .map(cloneContentRecord)
      .sort((left, right) => {
        const createdAtDiff = left.createdAt.getTime() - right.createdAt.getTime();

        return createdAtDiff === 0
          ? left.contentId.localeCompare(right.contentId)
          : createdAtDiff;
      });
  }
}

export class CryptoContentIdGenerator implements ContentIdGenerator {
  next(): ContentId {
    return `RCD-${randomUUID()}`;
  }
}
