import type { FolderId } from "@ecmp/shared-types";

export interface FolderContentReader {
  hasAssignedContent(folderId: FolderId): Promise<boolean>;
}
