import type { FolderId } from "@ecmp/shared-types";
import {
  ROOT_FOLDER_ID,
  SYSTEM_FOLDER_ID,
  SYSTEM_FOLDER_PATH,
  SYSTEM_SCHEMAS_FOLDER_ID,
  SYSTEM_SCHEMAS_FOLDER_PATH
} from "@ecmp/shared-types";

import type { FolderRecord } from "./folder";

const SYSTEM_FOLDER_NAME = "system";
const SYSTEM_SCHEMAS_FOLDER_NAME = "schemas";

export function createSystemFolder(now: Date = new Date()): FolderRecord {
  return {
    folderId: SYSTEM_FOLDER_ID,
    name: SYSTEM_FOLDER_NAME,
    parentFolderId: ROOT_FOLDER_ID,
    path: SYSTEM_FOLDER_PATH,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function createSystemSchemasFolder(now: Date = new Date()): FolderRecord {
  return {
    folderId: SYSTEM_SCHEMAS_FOLDER_ID,
    name: SYSTEM_SCHEMAS_FOLDER_NAME,
    parentFolderId: SYSTEM_FOLDER_ID,
    path: SYSTEM_SCHEMAS_FOLDER_PATH,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

/** Reserved folders that must never be renamed, moved, or deleted. */
export function isProtectedSystemFolderId(folderId: FolderId): boolean {
  return folderId === SYSTEM_FOLDER_ID || folderId === SYSTEM_SCHEMAS_FOLDER_ID;
}

/** True for `/system/schemas` and any descendant schema folder. */
export function isSchemaNamespacePath(path: string): boolean {
  return (
    path === SYSTEM_SCHEMAS_FOLDER_PATH ||
    path.startsWith(`${SYSTEM_SCHEMAS_FOLDER_PATH}/`)
  );
}

/** True for `/system` and any descendant (including the schema namespace). */
export function isSystemNamespacePath(path: string): boolean {
  return path === SYSTEM_FOLDER_PATH || path.startsWith(`${SYSTEM_FOLDER_PATH}/`);
}
