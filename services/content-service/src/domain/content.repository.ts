import type { ContentId, FolderId } from "@ecmp/shared-types";

import type { ContentRecordEntity } from "./content";

export interface ContentRepository {
  list(): Promise<ContentRecordEntity[]>;
  listByFolderId(folderId: FolderId): Promise<ContentRecordEntity[]>;
  findById(contentId: ContentId): Promise<ContentRecordEntity | null>;
  save(content: ContentRecordEntity): Promise<ContentRecordEntity>;
  replace(content: ContentRecordEntity): Promise<ContentRecordEntity>;
  delete(contentId: ContentId): Promise<void>;
  hasAssignedContent(folderId: FolderId): Promise<boolean>;
}
