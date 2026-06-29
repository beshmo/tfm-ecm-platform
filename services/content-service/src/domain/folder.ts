import type { FolderId } from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";

export interface FolderRecord {
  folderId: FolderId;
  name: string;
  parentFolderId: FolderId | null;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderRecordInput {
  folderId: FolderId;
  name: string;
  parent: FolderRecord;
  now?: Date;
}

export class FolderNameValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FolderNameValidationError";
  }
}

const ROOT_FOLDER_NAME = "Root";
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;
const UNSAFE_FILESYSTEM_SYMBOL_PATTERN = /[<>:"|?*]/u;

export function createRootFolder(now: Date = new Date()): FolderRecord {
  return {
    folderId: ROOT_FOLDER_ID,
    name: ROOT_FOLDER_NAME,
    parentFolderId: null,
    path: "/",
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function isRootFolderId(folderId: FolderId): boolean {
  return folderId === ROOT_FOLDER_ID;
}

export function normalizeFolderName(name: unknown): string {
  if (typeof name !== "string") {
    throw new FolderNameValidationError("Folder name must be a string.");
  }

  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    throw new FolderNameValidationError("Folder name must not be empty.");
  }

  if (normalizedName === "." || normalizedName === "..") {
    throw new FolderNameValidationError("Folder name must not be a relative path segment.");
  }

  if (normalizedName.includes("/") || normalizedName.includes("\\")) {
    throw new FolderNameValidationError("Folder name must not contain path separators.");
  }

  if (CONTROL_CHARACTER_PATTERN.test(normalizedName)) {
    throw new FolderNameValidationError("Folder name must not contain control characters.");
  }

  if (UNSAFE_FILESYSTEM_SYMBOL_PATTERN.test(normalizedName)) {
    throw new FolderNameValidationError("Folder name contains unsafe filesystem symbols.");
  }

  return normalizedName;
}

export function buildFolderPath(parentPath: string, name: string): string {
  return parentPath === "/" ? `/${name}` : `${parentPath}/${name}`;
}

export function createFolderRecord(input: CreateFolderRecordInput): FolderRecord {
  const now = input.now ?? new Date();
  const name = normalizeFolderName(input.name);

  return {
    folderId: input.folderId,
    name,
    parentFolderId: input.parent.folderId,
    path: buildFolderPath(input.parent.path, name),
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function renameFolderRecord(
  folder: FolderRecord,
  name: string,
  parent: FolderRecord,
  now: Date = new Date()
): FolderRecord {
  const normalizedName = normalizeFolderName(name);

  return {
    ...cloneFolderRecord(folder),
    name: normalizedName,
    path: buildFolderPath(parent.path, normalizedName),
    updatedAt: new Date(now)
  };
}

export function applyRenamedAncestorPath(
  folder: FolderRecord,
  previousAncestorPath: string,
  nextAncestorPath: string,
  now: Date = new Date()
): FolderRecord {
  if (folder.path === previousAncestorPath || !folder.path.startsWith(`${previousAncestorPath}/`)) {
    return cloneFolderRecord(folder);
  }

  return {
    ...cloneFolderRecord(folder),
    path: `${nextAncestorPath}${folder.path.slice(previousAncestorPath.length)}`,
    updatedAt: new Date(now)
  };
}

export function cloneFolderRecord(folder: FolderRecord): FolderRecord {
  return {
    ...folder,
    createdAt: new Date(folder.createdAt),
    updatedAt: new Date(folder.updatedAt)
  };
}
