import type { ContentId, ContentValidationError, FolderId } from "@ecmp/shared-types";

export class ContentNotFoundError extends Error {
  constructor(contentId: ContentId) {
    super(`Content record '${contentId}' was not found.`);
    this.name = "ContentNotFoundError";
  }
}

export class InvalidContentDataError extends Error {
  constructor(readonly errors: ContentValidationError[]) {
    super("Content data failed validation.");
    this.name = "InvalidContentDataError";
  }
}

export class ContentFolderNotFoundError extends Error {
  constructor(folderId: FolderId) {
    super(`Folder '${folderId}' was not found.`);
    this.name = "ContentFolderNotFoundError";
  }
}
