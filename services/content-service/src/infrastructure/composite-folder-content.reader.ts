import type { FolderId } from "@ecmp/shared-types";

import type { FolderContentReader } from "../domain/folder-content.reader";
import type { StaticFileRepository } from "../domain/static-file.repository";

export class CompositeFolderContentReader implements FolderContentReader {
  constructor(
    private readonly contentReader: FolderContentReader,
    private readonly staticFileRepository: StaticFileRepository
  ) {}

  async hasAssignedContent(folderId: FolderId): Promise<boolean> {
    return (
      (await this.contentReader.hasAssignedContent(folderId)) ||
      (await this.staticFileRepository.hasAssignedFiles(folderId))
    );
  }
}
