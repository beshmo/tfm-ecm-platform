import type { FolderErrorCode, FolderId } from "@ecmp/shared-types";

export class FolderApplicationError extends Error {
  constructor(
    message: string,
    readonly code: FolderErrorCode
  ) {
    super(message);
    this.name = "FolderApplicationError";
  }
}

export class FolderNotFoundError extends FolderApplicationError {
  constructor(folderId: FolderId) {
    super(`Folder ${folderId} was not found.`, "FOLDER_NOT_FOUND");
    this.name = "FolderNotFoundError";
  }
}

export class ParentFolderNotFoundError extends FolderApplicationError {
  constructor(folderId: FolderId) {
    super(`Parent folder ${folderId} was not found.`, "PARENT_FOLDER_NOT_FOUND");
    this.name = "ParentFolderNotFoundError";
  }
}

export class InvalidFolderNameError extends FolderApplicationError {
  constructor(message: string) {
    super(message, "INVALID_FOLDER_NAME");
    this.name = "InvalidFolderNameError";
  }
}

export class DuplicateFolderNameError extends FolderApplicationError {
  constructor(parentFolderId: FolderId, name: string) {
    super(
      `Folder name ${name} already exists under parent folder ${parentFolderId}.`,
      "DUPLICATE_FOLDER_NAME"
    );
    this.name = "DuplicateFolderNameError";
  }
}

export class RootFolderOperationNotAllowedError extends FolderApplicationError {
  constructor(operation: "rename" | "delete") {
    super(`The root folder cannot be ${operation}d.`, "ROOT_FOLDER_OPERATION_NOT_ALLOWED");
    this.name = "RootFolderOperationNotAllowedError";
  }
}

export class FolderNotEmptyError extends FolderApplicationError {
  constructor(folderId: FolderId) {
    super(`Folder ${folderId} is not empty.`, "FOLDER_NOT_EMPTY");
    this.name = "FolderNotEmptyError";
  }
}
