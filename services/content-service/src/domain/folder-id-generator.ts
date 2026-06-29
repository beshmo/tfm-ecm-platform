import type { FolderId } from "@ecmp/shared-types";

export interface FolderIdGenerator {
  next(): FolderId;
}
