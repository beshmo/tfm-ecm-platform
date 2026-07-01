import { describe, expect, it } from "vitest";

import type {
  CmisTypeDefinition,
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
import {
  CMIS_REPOSITORY_ID,
  CMIS_SUPPORTED_OPERATIONS,
  CMIS_TYPE_LOCAL_NAMESPACE,
  ECMP_CONTENT_TYPE_DEFINITION_ID,
  ECMP_DOCUMENT_TYPE_ID,
  ECMP_FOLDER_TYPE_ID,
  ECMP_OBJECT_TYPE_ID,
  INITIAL_GENERIC_CONTENT_TYPE_SCHEMA,
  ROOT_FOLDER_ID,
  cmisBaseTypeDefinitions,
  cmisError,
  cmisObjectFromContentRecord,
  cmisObjectFromFolder,
  cmisObjectFromStaticFile,
  cmisObjectTypeIdFromEcmpObjectType,
  cmisRepositoryInfo,
  cmisServiceDocument,
  cmisTypeDefinitionFromSchema,
  cmisTypeIdForContentType,
  contentTypeFromCmisTypeId,
  ecmpBuiltInObjectTypeDefinitions,
  ecmpObjectTypeFromSchema
} from "./index";

const COMMON_OBJECT_TYPE_ATTRIBUTES = [
  "id",
  "localName",
  "localNamespace",
  "queryName",
  "displayName",
  "parentId",
  "description",
  "creatable",
  "fileable",
  "queryable",
  "controllablePolicy",
  "controllableACL",
  "fulltextIndexed",
  "includedInSupertypeQuery",
  "typeMutability"
] as const;

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
      fields: [
        { name: "title", type: "string", required: true },
        { name: "priority", type: "integer", required: false },
        { name: "publishDate", type: "date", required: false },
        { name: "publishTime", type: "time", required: false }
      ]
    };

    expect(schema.fields.map((field) => field.name)).toEqual([
      "title",
      "priority",
      "publishDate",
      "publishTime"
    ]);
    expect(schema.fields[0]?.required).toBe(true);
    expect(schema.fields[1]?.type).toBe("integer");
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
      fields: [
        { name: "title", type: "string", required: true },
        { name: "priority", type: "integer", required: false },
        { name: "publishDate", type: "date", required: false },
        { name: "publishTime", type: "time", required: false }
      ]
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

  it("GIVEN document contracts WHEN shared THEN metadata management shapes are supported", () => {
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

  it("GIVEN CMIS repository metadata WHEN shared THEN conservative Browser Binding capabilities are exposed", () => {
    const repository = cmisRepositoryInfo();
    const serviceDocument = cmisServiceDocument();

    expect(repository).toMatchObject({
      repositoryId: CMIS_REPOSITORY_ID,
      cmisVersionSupported: "1.1",
      rootFolderId: ROOT_FOLDER_ID,
      capabilities: {
        navigation: true,
        query: false,
        versioning: false,
        aclMutation: false
      }
    });
    expect(repository.supportedOperations).toEqual([...CMIS_SUPPORTED_OPERATIONS]);
    expect(serviceDocument.repositories[CMIS_REPOSITORY_ID]).toEqual(repository);
  });

  it("GIVEN the ECMP object-type model WHEN built-in types are listed THEN the hierarchy descends from Object Type", () => {
    const builtIns = ecmpBuiltInObjectTypeDefinitions();
    const byId = new Map(builtIns.map((definition) => [definition.id, definition]));

    expect(builtIns.map((definition) => definition.id)).toEqual([
      ECMP_OBJECT_TYPE_ID,
      ECMP_FOLDER_TYPE_ID,
      ECMP_DOCUMENT_TYPE_ID,
      ECMP_CONTENT_TYPE_DEFINITION_ID
    ]);
    expect(byId.get(ECMP_OBJECT_TYPE_ID)).toMatchObject({ parentId: null });
    expect(byId.get(ECMP_FOLDER_TYPE_ID)).toMatchObject({ parentId: ECMP_OBJECT_TYPE_ID });
    expect(byId.get(ECMP_DOCUMENT_TYPE_ID)).toMatchObject({
      parentId: ECMP_OBJECT_TYPE_ID,
      displayName: "Document Type"
    });
    expect(byId.get(ECMP_CONTENT_TYPE_DEFINITION_ID)).toMatchObject({
      parentId: ECMP_OBJECT_TYPE_ID
    });
  });

  it("GIVEN an ECMP object type WHEN it is returned THEN it exposes every common object-type attribute", () => {
    const definitions = [
      ...ecmpBuiltInObjectTypeDefinitions(),
      ecmpObjectTypeFromSchema(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA)
    ];

    for (const definition of definitions) {
      for (const attribute of COMMON_OBJECT_TYPE_ATTRIBUTES) {
        expect(definition).toHaveProperty(attribute);
      }
      expect(definition.typeMutability).toEqual({ create: false, update: false, delete: false });
    }
  });

  it("GIVEN a user content type schema WHEN represented as an ECMP object type THEN its parent is Content Type Definition", () => {
    const generic = ecmpObjectTypeFromSchema(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA);

    expect(generic).toMatchObject({
      id: "ecmp:generic",
      parentId: ECMP_CONTENT_TYPE_DEFINITION_ID,
      baseId: ECMP_OBJECT_TYPE_ID
    });
  });

  it("GIVEN ECMP object types WHEN projected to CMIS THEN the internal root is not advertised", () => {
    expect(cmisObjectTypeIdFromEcmpObjectType(ECMP_OBJECT_TYPE_ID)).toBeNull();
    expect(cmisObjectTypeIdFromEcmpObjectType(ECMP_FOLDER_TYPE_ID)).toBe("cmis:folder");
    expect(cmisObjectTypeIdFromEcmpObjectType(ECMP_DOCUMENT_TYPE_ID)).toBe("cmis:document");
    expect(cmisObjectTypeIdFromEcmpObjectType(ECMP_CONTENT_TYPE_DEFINITION_ID)).toBe(
      "ecmp:content-type-definition"
    );
  });

  it("GIVEN ECMP schemas WHEN mapped to CMIS THEN type definitions preserve identity and fields", () => {
    const baseTypes = cmisBaseTypeDefinitions();
    const articleType = cmisTypeDefinitionFromSchema({
      name: "article",
      version: "1.0",
      fields: [
        { name: "title", type: "string", required: true },
        { name: "priority", type: "integer", required: false }
      ]
    });

    expect(baseTypes.map((type) => type.id)).toEqual([
      "cmis:folder",
      "cmis:document",
      "cmis:item",
      "ecmp:content-type-definition"
    ]);
    expect(baseTypes.find((type) => type.id === "ecmp:content-type-definition")).toMatchObject({
      baseId: "cmis:item",
      parentId: "cmis:item"
    });
    expect(cmisTypeIdForContentType("article")).toBe("ecmp:article");
    expect(contentTypeFromCmisTypeId("ecmp:article")).toBe("article");
    expect(articleType).toMatchObject({
      id: "ecmp:article",
      baseId: "cmis:item",
      parentId: "ecmp:content-type-definition",
      localNamespace: CMIS_TYPE_LOCAL_NAMESPACE,
      contentStreamAllowed: "notallowed"
    });
    expect(articleType.propertyDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "ecmp:title", required: true, propertyType: "string" }),
        expect.objectContaining({ id: "ecmp:priority", required: false, propertyType: "integer" })
      ])
    );
  });

  it("GIVEN CMIS base type discovery WHEN listed THEN it includes cmis:item and excludes unsupported optional base types", () => {
    const baseTypeIds = cmisBaseTypeDefinitions().map((type) => type.id);

    expect(baseTypeIds).toContain("cmis:item");
    expect(baseTypeIds).not.toContain("cmis:relationship");
    expect(baseTypeIds).not.toContain("cmis:policy");
    expect(baseTypeIds).not.toContain("cmis:secondary");
  });

  it("GIVEN any CMIS type definition WHEN returned THEN it exposes the CMIS 1.1 common object-type attributes with conservative flags", () => {
    const definitions: CmisTypeDefinition[] = [
      ...cmisBaseTypeDefinitions(),
      cmisTypeDefinitionFromSchema(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA)
    ];

    for (const definition of definitions) {
      for (const attribute of [...COMMON_OBJECT_TYPE_ATTRIBUTES, "baseId"]) {
        expect(definition).toHaveProperty(attribute);
      }
      expect(definition).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          localName: expect.any(String),
          localNamespace: expect.any(String),
          queryName: expect.any(String),
          displayName: expect.any(String),
          description: expect.any(String),
          baseId: expect.any(String),
          creatable: expect.any(Boolean),
          fileable: expect.any(Boolean),
          queryable: false,
          controllablePolicy: false,
          controllableACL: false,
          fulltextIndexed: false,
          includedInSupertypeQuery: false,
          typeMutability: { create: false, update: false, delete: false }
        })
      );
    }
  });

  it("GIVEN CMIS base types WHEN inspected THEN only cmis:folder, cmis:document, and cmis:item have a null parent", () => {
    for (const baseType of cmisBaseTypeDefinitions()) {
      if (baseType.id === "ecmp:content-type-definition") {
        expect(baseType.parentId).toBe("cmis:item");
      } else {
        expect(baseType.parentId).toBeNull();
      }
    }
  });

  it("GIVEN a user content type WHEN mapped to CMIS THEN parentId is the content type definition", () => {
    const generic = cmisTypeDefinitionFromSchema(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA);

    expect(generic).toMatchObject({
      id: "ecmp:generic",
      baseId: "cmis:item",
      parentId: "ecmp:content-type-definition"
    });
  });

  it("GIVEN ECMP resources WHEN mapped to CMIS THEN object representations include properties and allowable actions", () => {
    const folder = cmisObjectFromFolder({
      folderId: ROOT_FOLDER_ID,
      name: "Root",
      parentFolderId: null,
      path: "/",
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    });
    const file = cmisObjectFromStaticFile({
      fileId: "STF-123",
      folderId: ROOT_FOLDER_ID,
      filename: "manual.pdf",
      mimeType: "application/pdf",
      size: 7,
      path: "stored/STF-123.pdf",
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    });
    const content = cmisObjectFromContentRecord({
      contentId: "RCD-123",
      folderId: ROOT_FOLDER_ID,
      contentType: "article",
      schemaVersion: "1.0",
      version: 2,
      status: "draft",
      data: { title: "Welcome", priority: 1 },
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    });

    expect(folder).toMatchObject({
      objectId: ROOT_FOLDER_ID,
      name: "/",
      typeId: "cmis:folder",
      allowableActions: { canGetChildren: true, canDeleteObject: false }
    });
    expect(file).toMatchObject({
      objectId: "STF-123",
      typeId: "cmis:document",
      contentStream: { mimeType: "application/pdf", filename: "manual.pdf", length: 7 }
    });
    expect(content).toMatchObject({
      objectId: "RCD-123",
      typeId: "ecmp:article",
      baseTypeId: "cmis:item",
      properties: {
        "ecmp:title": "Welcome",
        "ecmp:priority": 1,
        "ecmp:schemaVersion": "1.0"
      }
    });
  });

  it("GIVEN restricted permissions WHEN CMIS actions are mapped THEN unsupported actions are hidden", () => {
    const file = cmisObjectFromStaticFile(
      {
        fileId: "STF-123",
        folderId: ROOT_FOLDER_ID,
        filename: "manual.pdf",
        mimeType: "application/pdf",
        size: 7,
        path: "stored/STF-123.pdf",
        createdAt: "2026-06-29T10:00:00.000Z",
        updatedAt: "2026-06-29T10:00:00.000Z"
      },
      ["file:read"]
    );

    expect(file.allowableActions).toMatchObject({
      canGetObject: true,
      canGetContentStream: true,
      canDeleteObject: false,
      canCreateFolder: false,
      canCreateDocument: false
    });
  });

  it("GIVEN CMIS errors WHEN created THEN exception and message are returned", () => {
    expect(cmisError("notSupported", "CMIS query is not supported.")).toEqual({
      exception: "notSupported",
      message: "CMIS query is not supported."
    });
  });
});
