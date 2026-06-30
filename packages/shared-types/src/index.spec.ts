import { describe, expect, it } from "vitest";

import type {
  ContentCreateInput,
  ContentId,
  ContentFieldType,
  ContentInstanceData,
  ContentInstanceValidationInput,
  ContentPatchInput,
  ContentRecord,
  ContentReplaceInput,
  ContentStatus,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentValidationError,
  ContentValidationErrorCode,
  ContentValidationResult,
  Folder,
  FolderCreateInput,
  FolderErrorCode,
  FolderId,
  FolderUpdateInput,
  Permission,
  StaticFile,
  StaticFileErrorCode,
  StaticFileId,
  StaticFileUpdateInput
} from "./index";
import { INITIAL_GENERIC_CONTENT_TYPE_SCHEMA, ROOT_FOLDER_ID } from "./index";

describe("shared types", () => {
  it("supports prefixed content IDs and resource permissions", () => {
    const contentId: ContentId = "RCD-123";
    const folderId: FolderId = "FLD-123";
    const fileId: StaticFileId = "STF-123";
    const permission: Permission = "folder:read";

    expect(contentId).toBe("RCD-123");
    expect(folderId).toBe("FLD-123");
    expect(fileId).toBe("STF-123");
    expect(permission).toBe("folder:read");
  });

  it("GIVEN the reserved root folder WHEN shared THEN it exposes nullable parent folder identity", () => {
    const rootFolder: Folder = {
      folderId: ROOT_FOLDER_ID,
      name: "Root",
      parentFolderId: null,
      path: "/",
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    };

    expect(rootFolder.folderId).toBe("FLD-root");
    expect(rootFolder.parentFolderId).toBeNull();
    expect(rootFolder.path).toBe("/");
  });

  it("GIVEN folder create and update inputs WHEN shared THEN folder management DTO shapes are supported", () => {
    const createInput: FolderCreateInput = {
      name: "folder1",
      parentFolderId: ROOT_FOLDER_ID
    };
    const updateInput: FolderUpdateInput = {
      name: "renamed-folder"
    };
    const supportedErrorCodes: FolderErrorCode[] = [
      "FOLDER_NOT_FOUND",
      "PARENT_FOLDER_NOT_FOUND",
      "INVALID_FOLDER_NAME",
      "DUPLICATE_FOLDER_NAME",
      "ROOT_FOLDER_OPERATION_NOT_ALLOWED",
      "FOLDER_NOT_EMPTY"
    ];

    expect(createInput.parentFolderId).toBe("FLD-root");
    expect(updateInput.name).toBe("renamed-folder");
    expect(supportedErrorCodes).toContain("FOLDER_NOT_EMPTY");
  });

  it("GIVEN a normalized content type schema WHEN fields are defined THEN simple field types are supported", () => {
    const supportedFieldTypes: ContentFieldType[] = ["string", "integer", "date", "time"];
    const schema: ContentTypeSchemaDefinition = {
      name: "generic",
      version: "1.0",
      fields: {
        title: { type: "string", required: true },
        priority: { type: "integer", required: false },
        publishDate: { type: "date", required: false },
        publishTime: { type: "time", required: false }
      }
    };

    expect(schema.fields["title"]?.required).toBe(true);
    expect(schema.fields["priority"]?.type).toBe("integer");
    expect(supportedFieldTypes).toEqual(["string", "integer", "date", "time"]);
  });

  it("GIVEN a content type schema summary WHEN it is shared THEN it exposes lifecycle state", () => {
    const summary: ContentTypeSchemaSummary = {
      name: "generic",
      version: "1.0",
      active: true
    };

    expect(summary).toEqual({
      name: "generic",
      version: "1.0",
      active: true
    });
  });

  it("GIVEN the initial generic schema WHEN shared THEN it exposes the local development seed", () => {
    expect(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA).toEqual({
      name: "generic",
      version: "1.0",
      fields: {
        title: { type: "string", required: true },
        priority: { type: "integer", required: false },
        publishDate: { type: "date", required: false },
        publishTime: { type: "time", required: false }
      }
    });
  });

  it("GIVEN a content validation result WHEN validation fails THEN structured errors describe invalid fields", () => {
    const supportedErrorCodes: ContentValidationErrorCode[] = [
      "INVALID_CONTENT_DATA",
      "REQUIRED_FIELD_MISSING",
      "UNKNOWN_FIELD",
      "FORBIDDEN_FIELD_NAME",
      "INVALID_STRING",
      "INVALID_INTEGER",
      "INVALID_DATE",
      "INVALID_TIME"
    ];
    const data: ContentInstanceData = { publishDate: "tomorrow" };
    const input: ContentInstanceValidationInput = {
      contentType: "article",
      schemaVersion: "1.0",
      data
    };
    const error: ContentValidationError = {
      field: "publishDate",
      code: "INVALID_DATE",
      message: "publishDate must be a valid date using YYYY-MM-DD format."
    };
    const result: ContentValidationResult = {
      valid: false,
      errors: [error]
    };

    expect(input.schemaVersion).toBe("1.0");
    expect(result.errors[0]?.code).toBe("INVALID_DATE");
    expect(supportedErrorCodes).toContain("FORBIDDEN_FIELD_NAME");
  });

  it("GIVEN validation input WHEN schema version is omitted THEN latest schema resolution can be requested", () => {
    const input: ContentInstanceValidationInput = {
      contentType: "article",
      data: { title: "Welcome" }
    };

    expect(input.schemaVersion).toBeUndefined();
  });

  it("GIVEN content record contracts WHEN shared THEN draft content CRUD shapes are supported", () => {
    const status: ContentStatus = "draft";
    const record: ContentRecord = {
      contentId: "RCD-123",
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      schemaVersion: "1.0",
      version: 1,
      status,
      data: { title: "Welcome" },
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    };
    const createInput: ContentCreateInput = {
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      data: { title: "Welcome" }
    };
    const replaceInput: ContentReplaceInput = {
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      schemaVersion: "1.0",
      data: { title: "Updated" }
    };
    const patchInput: ContentPatchInput = {
      data: { title: "Patched" }
    };

    expect(record).toMatchObject({
      contentId: "RCD-123",
      folderId: "FLD-root",
      contentType: "article",
      schemaVersion: "1.0",
      version: 1,
      status: "draft"
    });
    expect(createInput.schemaVersion).toBeUndefined();
    expect(replaceInput.data["title"]).toBe("Updated");
    expect(patchInput.data?.["title"]).toBe("Patched");
  });

  it("GIVEN static file contracts WHEN shared THEN metadata management shapes are supported", () => {
    const file: StaticFile = {
      fileId: "STF-123",
      folderId: ROOT_FOLDER_ID,
      filename: "manual.pdf",
      mimeType: "application/pdf",
      size: 124500,
      path: "files/STF-123.pdf",
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    };
    const updateInput: StaticFileUpdateInput = {
      filename: "manual-v2.pdf"
    };
    const supportedErrorCodes: StaticFileErrorCode[] = [
      "STATIC_FILE_NOT_FOUND",
      "STATIC_FILE_FOLDER_NOT_FOUND",
      "INVALID_STATIC_FILE_NAME",
      "MISSING_STATIC_FILE_UPLOAD",
      "UNSUPPORTED_STATIC_FILE_MIME_TYPE",
      "STATIC_FILE_TOO_LARGE",
      "STATIC_FILE_STORAGE_FAILURE"
    ];

    expect(file).toMatchObject({
      fileId: "STF-123",
      folderId: "FLD-root",
      filename: "manual.pdf",
      mimeType: "application/pdf"
    });
    expect(updateInput.filename).toBe("manual-v2.pdf");
    expect(supportedErrorCodes).toContain("STATIC_FILE_STORAGE_FAILURE");
  });
});
