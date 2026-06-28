export type GlobalIdPrefix = "RCD" | "FLD" | "STF" | "USR";

export type ContentId = `RCD-${string}`;
export type FolderId = `FLD-${string}`;
export type StaticFileId = `STF-${string}`;
export type UserId = `USR-${string}`;

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
