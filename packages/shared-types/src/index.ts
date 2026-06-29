export type GlobalIdPrefix = "RCD" | "FLD" | "STF" | "USR";

export type ContentId = `RCD-${string}`;
export type FolderId = `FLD-${string}`;
export type StaticFileId = `STF-${string}`;
export type UserId = `USR-${string}`;

export const ROOT_FOLDER_ID: FolderId = "FLD-root";

export interface Folder {
  folderId: FolderId;
  name: string;
  parentFolderId: FolderId | null;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderCreateInput {
  name: string;
  parentFolderId: FolderId;
}

export interface FolderUpdateInput {
  name: string;
}

export type FolderErrorCode =
  | "FOLDER_NOT_FOUND"
  | "PARENT_FOLDER_NOT_FOUND"
  | "INVALID_FOLDER_NAME"
  | "DUPLICATE_FOLDER_NAME"
  | "ROOT_FOLDER_OPERATION_NOT_ALLOWED"
  | "FOLDER_NOT_EMPTY";

export type Role = "Admin" | "Creator" | "Reviewer" | "Publisher";

export type PermissionAction = "read" | "create" | "update" | "delete" | "*";
export type PermissionResource =
  | "explorer"
  | "folder"
  | "file"
  | "workflow"
  | "content-type"
  | string;

export type Permission = `${PermissionResource}:${PermissionAction}`;

export interface HealthResponse {
  service: string;
  status: "ok";
}

export type ContentTypeName = string;
export type ContentTypeVersion = string;
export type ContentFieldType = "string" | "integer" | "date" | "time";

export interface ContentTypeFieldDefinition {
  type: ContentFieldType;
  required: boolean;
}

export interface ContentTypeSchemaDefinition {
  name: ContentTypeName;
  version: ContentTypeVersion;
  fields: Record<string, ContentTypeFieldDefinition>;
}

export interface ContentTypeSchemaSummary {
  name: ContentTypeName;
  version: ContentTypeVersion;
  active: boolean;
}

export type ContentInstanceData = Record<string, unknown>;
export type ContentStatus = "draft";

export interface ContentRecord {
  contentId: ContentId;
  folderId: FolderId;
  contentType: ContentTypeName;
  schemaVersion: ContentTypeVersion;
  version: number;
  status: ContentStatus;
  data: ContentInstanceData;
  createdAt: string;
  updatedAt: string;
}

export interface ContentCreateInput {
  folderId: FolderId;
  contentType: ContentTypeName;
  schemaVersion?: ContentTypeVersion;
  data: ContentInstanceData;
}

export interface ContentReplaceInput {
  folderId: FolderId;
  contentType?: ContentTypeName;
  schemaVersion?: ContentTypeVersion;
  data: ContentInstanceData;
}

export interface ContentPatchInput {
  folderId?: FolderId;
  contentType?: ContentTypeName;
  schemaVersion?: ContentTypeVersion;
  data?: ContentInstanceData;
}

export type ContentValidationErrorCode =
  | "INVALID_CONTENT_DATA"
  | "REQUIRED_FIELD_MISSING"
  | "UNKNOWN_FIELD"
  | "FORBIDDEN_FIELD_NAME"
  | "INVALID_STRING"
  | "INVALID_INTEGER"
  | "INVALID_DATE"
  | "INVALID_TIME";

export interface ContentValidationError {
  field: string;
  code: ContentValidationErrorCode;
  message: string;
}

export interface ContentValidationResult {
  valid: boolean;
  errors: ContentValidationError[];
}

export interface ContentInstanceValidationInput {
  contentType: ContentTypeName;
  schemaVersion?: ContentTypeVersion;
  data: unknown;
}
