import type { FolderId } from "@ecmp/shared-types";

import type { FolderContentReader } from "../domain/folder-content.reader";
import type { StaticFileRepository } from "../domain/static-file.repository";

export interface FolderDefinitionOccupancyReader {
  hasDefinitionsInFolder(folderId: FolderId): Promise<boolean>;
}

export class CompositeFolderContentReader implements FolderContentReader {
  constructor(
    private readonly contentReader: FolderContentReader,
    private readonly staticFileRepository: StaticFileRepository,
    private readonly schemaDefinitions: FolderDefinitionOccupancyReader
  ) {}

  async hasAssignedContent(folderId: FolderId): Promise<boolean> {
    return (
      (await this.contentReader.hasAssignedContent(folderId)) ||
      (await this.staticFileRepository.hasAssignedFiles(folderId)) ||
      (await this.schemaDefinitions.hasDefinitionsInFolder(folderId))
    );
  }
}
