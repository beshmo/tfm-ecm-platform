import type { FolderId } from "@ecmp/shared-types";

import type { FolderRecord } from "./folder";

export interface FolderRepository {
  list(): Promise<FolderRecord[]>;
  listByParentFolderId(parentFolderId: FolderId): Promise<FolderRecord[]>;
  findById(folderId: FolderId): Promise<FolderRecord | null>;
  findByParentFolderIdAndName(
    parentFolderId: FolderId,
    name: string,
    excludeFolderId?: FolderId
  ): Promise<FolderRecord | null>;
  save(folder: FolderRecord): Promise<FolderRecord>;
  replace(folder: FolderRecord): Promise<FolderRecord>;
  replaceMany(folders: FolderRecord[]): Promise<FolderRecord[]>;
  delete(folderId: FolderId): Promise<void>;
}
