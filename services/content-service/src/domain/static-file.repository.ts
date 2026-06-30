import type { FolderId, StaticFileId } from "@ecmp/shared-types";

import type { StaticFileEntity } from "./static-file";

export interface StaticFileRepository {
  listByFolderId(folderId: FolderId): Promise<StaticFileEntity[]>;
  findById(fileId: StaticFileId): Promise<StaticFileEntity | null>;
  save(file: StaticFileEntity): Promise<StaticFileEntity>;
  replace(file: StaticFileEntity): Promise<StaticFileEntity>;
  delete(fileId: StaticFileId): Promise<void>;
  hasAssignedFiles(folderId: FolderId): Promise<boolean>;
}
