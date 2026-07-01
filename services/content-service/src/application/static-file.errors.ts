import type { FolderId, StaticFileId } from "@ecmp/shared-types";

export class StaticFileNotFoundError extends Error {
  constructor(fileId: StaticFileId) {
    super(`Document '${fileId}' was not found.`);
    this.name = "StaticFileNotFoundError";
  }
}

export class StaticFileFolderNotFoundError extends Error {
  constructor(folderId: FolderId) {
    super(`Folder '${folderId}' was not found.`);
    this.name = "StaticFileFolderNotFoundError";
  }
}

export class InvalidStaticFileNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStaticFileNameError";
  }
}

export class MissingStaticFileUploadError extends Error {
  constructor() {
    super("Document upload requires a file.");
    this.name = "MissingStaticFileUploadError";
  }
}

export class UnsupportedStaticFileUploadMimeTypeError extends Error {
  constructor(readonly mimeType: string) {
    super(`Document MIME type '${mimeType}' is not supported.`);
    this.name = "UnsupportedStaticFileUploadMimeTypeError";
  }
}

export class StaticFileUploadTooLargeError extends Error {
  constructor(readonly size: number) {
    super(`Document size ${size} exceeds the maximum allowed size.`);
    this.name = "StaticFileUploadTooLargeError";
  }
}

export class StaticFileStorageError extends Error {
  constructor(message = "Document storage operation failed.") {
    super(message);
    this.name = "StaticFileStorageError";
  }
}
