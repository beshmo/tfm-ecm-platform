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

export const INITIAL_GENERIC_CONTENT_TYPE_SCHEMA: ContentTypeSchemaDefinition = {
  name: "generic",
  version: "1.0",
  fields: {
    title: { type: "string", required: true },
    priority: { type: "integer", required: false },
    publishDate: { type: "date", required: false },
    publishTime: { type: "time", required: false }
  }
};

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

export interface StaticFile {
  fileId: StaticFileId;
  folderId: FolderId;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaticFileUpdateInput {
  filename: string;
}

export type StaticFileErrorCode =
  | "STATIC_FILE_NOT_FOUND"
  | "STATIC_FILE_FOLDER_NOT_FOUND"
  | "INVALID_STATIC_FILE_NAME"
  | "MISSING_STATIC_FILE_UPLOAD"
  | "UNSUPPORTED_STATIC_FILE_MIME_TYPE"
  | "STATIC_FILE_TOO_LARGE"
  | "STATIC_FILE_STORAGE_FAILURE";

export const CMIS_REPOSITORY_ID = "ecmp-management";
export const CMIS_ROOT_FOLDER_ID = ROOT_FOLDER_ID;

export const CMIS_SUPPORTED_OPERATIONS = [
  "getRepositoryInfo",
  "getTypeChildren",
  "getChildren",
  "getObject",
  "getObjectByPath",
  "getContentStream",
  "createFolder",
  "createDocument",
  "deleteObject"
] as const;

export type CmisSupportedOperation = (typeof CMIS_SUPPORTED_OPERATIONS)[number];

export interface CmisRepositoryCapabilities {
  navigation: true;
  objectById: true;
  objectByPath: true;
  contentStream: true;
  createFolder: true;
  createDocument: true;
  deleteObject: true;
  query: false;
  changes: false;
  relationships: false;
  policies: false;
  renditions: false;
  versioning: false;
  multifiling: false;
  unfiling: false;
  aclMutation: false;
}

export interface CmisRepositoryInfo {
  repositoryId: string;
  repositoryName: string;
  cmisVersionSupported: "1.1";
  rootFolderId: FolderId;
  repositoryUrl: string;
  rootFolderUrl: string;
  capabilities: CmisRepositoryCapabilities;
  supportedOperations: CmisSupportedOperation[];
}

export interface CmisServiceDocument {
  repositories: Record<string, CmisRepositoryInfo>;
}

export type CmisBaseTypeId = "cmis:folder" | "cmis:document" | "cmis:item";
export type CmisObjectTypeId = CmisBaseTypeId | `ecmp:${string}`;
export type CmisPropertyType = "id" | "string" | "integer" | "datetime" | "boolean";

export interface CmisPropertyDefinition {
  id: string;
  displayName: string;
  propertyType: CmisPropertyType;
  required: boolean;
  updatability: "readonly" | "readwrite";
}

/**
 * CMIS 1.1 base type namespace used for the CMIS-standard base object types.
 */
export const CMIS_CORE_NAMESPACE = "http://docs.oasis-open.org/ns/cmis/core/200908/";

/**
 * Local namespace for ECMP-owned CMIS custom object types.
 */
export const CMIS_TYPE_LOCAL_NAMESPACE = "https://ecmp.local/cmis/types";

/**
 * Type mutability flags required by CMIS 1.1 common object-type attributes.
 * ECMP does not support CMIS type management, so all flags are conservatively `false`.
 */
export interface CmisTypeMutability {
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface CmisTypeDefinition {
  id: CmisObjectTypeId;
  localName: string;
  localNamespace: string;
  queryName: string;
  displayName: string;
  description: string;
  baseId: CmisBaseTypeId;
  parentId: CmisObjectTypeId | null;
  creatable: boolean;
  fileable: boolean;
  queryable: boolean;
  controllablePolicy: boolean;
  controllableACL: boolean;
  fulltextIndexed: boolean;
  includedInSupertypeQuery: boolean;
  versionable: boolean;
  contentStreamAllowed: "notallowed" | "allowed" | "required";
  typeMutability: CmisTypeMutability;
  propertyDefinitions: CmisPropertyDefinition[];
}

export type CmisPropertyValue = string | number | boolean | null;

export interface CmisContentStreamMetadata {
  length: number;
  mimeType: string;
  filename: string;
}

export interface CmisAllowableActions {
  canGetObject: boolean;
  canGetProperties: boolean;
  canGetChildren: boolean;
  canGetContentStream: boolean;
  canCreateFolder: boolean;
  canCreateDocument: boolean;
  canDeleteObject: boolean;
}

export interface CmisObject {
  objectId: string;
  name: string;
  typeId: CmisObjectTypeId;
  baseTypeId: CmisBaseTypeId;
  parentId: FolderId | null;
  path: string;
  properties: Record<string, CmisPropertyValue>;
  allowableActions: CmisAllowableActions;
  contentStream?: CmisContentStreamMetadata;
}

export type CmisErrorCode =
  | "invalidArgument"
  | "notFound"
  | "notSupported"
  | "permissionDenied"
  | "constraint"
  | "contentAlreadyExists"
  | "storage";

export interface CmisErrorResponse {
  exception: CmisErrorCode;
  message: string;
}

export function cmisRepositoryInfo(baseUrl = "/api/cmis"): CmisRepositoryInfo {
  return {
    repositoryId: CMIS_REPOSITORY_ID,
    repositoryName: "ECMP Management Repository",
    cmisVersionSupported: "1.1",
    rootFolderId: CMIS_ROOT_FOLDER_ID,
    repositoryUrl: `${baseUrl}/${CMIS_REPOSITORY_ID}`,
    rootFolderUrl: `${baseUrl}/${CMIS_REPOSITORY_ID}/root`,
    capabilities: {
      navigation: true,
      objectById: true,
      objectByPath: true,
      contentStream: true,
      createFolder: true,
      createDocument: true,
      deleteObject: true,
      query: false,
      changes: false,
      relationships: false,
      policies: false,
      renditions: false,
      versioning: false,
      multifiling: false,
      unfiling: false,
      aclMutation: false
    },
    supportedOperations: [...CMIS_SUPPORTED_OPERATIONS]
  };
}

export function cmisServiceDocument(baseUrl = "/api/cmis"): CmisServiceDocument {
  const repository = cmisRepositoryInfo(baseUrl);

  return {
    repositories: {
      [repository.repositoryId]: repository
    }
  };
}

export function cmisTypeIdForContentType(contentType: ContentTypeName): `ecmp:${string}` {
  return `ecmp:${contentType}`;
}

export function contentTypeFromCmisTypeId(typeId: CmisObjectTypeId): ContentTypeName | null {
  return typeId.startsWith("ecmp:") ? typeId.slice("ecmp:".length) : null;
}

export function cmisBaseTypeDefinitions(): CmisTypeDefinition[] {
  return [
    {
      id: "cmis:folder",
      localName: "folder",
      queryName: "cmis:folder",
      displayName: "Folder",
      description: "ECMP folder object type.",
      baseId: "cmis:folder",
      parentId: null,
      creatable: true,
      fileable: true,
      versionable: false,
      contentStreamAllowed: "notallowed",
      ...commonTypeAttributes(CMIS_CORE_NAMESPACE),
      propertyDefinitions: commonPropertyDefinitions()
    },
    {
      id: "cmis:document",
      localName: "document",
      queryName: "cmis:document",
      displayName: "Document",
      description: "ECMP static file document object type.",
      baseId: "cmis:document",
      parentId: null,
      creatable: true,
      fileable: true,
      versionable: false,
      contentStreamAllowed: "required",
      ...commonTypeAttributes(CMIS_CORE_NAMESPACE),
      propertyDefinitions: [
        ...commonPropertyDefinitions(),
        propertyDefinition("cmis:contentStreamLength", "Content Stream Length", "integer", true),
        propertyDefinition("cmis:contentStreamMimeType", "Content Stream MIME Type", "string", true),
        propertyDefinition("cmis:contentStreamFileName", "Content Stream File Name", "string", true)
      ]
    },
    {
      id: "cmis:item",
      localName: "item",
      queryName: "cmis:item",
      displayName: "Item",
      description: "ECMP structured content record base object type.",
      baseId: "cmis:item",
      parentId: null,
      creatable: false,
      fileable: true,
      versionable: false,
      contentStreamAllowed: "notallowed",
      ...commonTypeAttributes(CMIS_CORE_NAMESPACE),
      propertyDefinitions: commonPropertyDefinitions()
    }
  ];
}

export function cmisTypeDefinitionFromSchema(
  schema: ContentTypeSchemaDefinition
): CmisTypeDefinition {
  return {
    id: cmisTypeIdForContentType(schema.name),
    localName: schema.name,
    queryName: cmisTypeIdForContentType(schema.name),
    displayName: schema.name,
    description: `ECMP ${schema.name} content record type.`,
    baseId: "cmis:item",
    parentId: "cmis:item",
    creatable: false,
    fileable: true,
    versionable: false,
    contentStreamAllowed: "notallowed",
    ...commonTypeAttributes(CMIS_TYPE_LOCAL_NAMESPACE),
    propertyDefinitions: [
      ...commonPropertyDefinitions(),
      propertyDefinition("ecmp:schemaVersion", "Schema Version", "string", true),
      propertyDefinition("ecmp:version", "Version", "integer", true),
      propertyDefinition("ecmp:status", "Status", "string", true),
      ...Object.entries(schema.fields).map(([fieldName, definition]) =>
        propertyDefinition(
          `ecmp:${fieldName}`,
          fieldName,
          cmisPropertyTypeForContentField(definition.type),
          definition.required,
          "readwrite"
        )
      )
    ]
  };
}

export function cmisObjectFromFolder(
  folder: Folder,
  permissions: Permission[] = []
): CmisObject {
  return {
    objectId: folder.folderId,
    name: folder.folderId === ROOT_FOLDER_ID ? "/" : folder.name,
    typeId: "cmis:folder",
    baseTypeId: "cmis:folder",
    parentId: folder.parentFolderId,
    path: folder.path,
    properties: {
      "cmis:objectId": folder.folderId,
      "cmis:name": folder.folderId === ROOT_FOLDER_ID ? "/" : folder.name,
      "cmis:objectTypeId": "cmis:folder",
      "cmis:baseTypeId": "cmis:folder",
      "cmis:parentId": folder.parentFolderId,
      "cmis:path": folder.path,
      "cmis:creationDate": folder.createdAt,
      "cmis:lastModificationDate": folder.updatedAt
    },
    allowableActions: cmisAllowableActions("folder", permissions, {
      canGetChildren: true,
      canGetContentStream: false,
      canDeleteObject: folder.folderId !== ROOT_FOLDER_ID
    })
  };
}

export function cmisObjectFromStaticFile(
  file: StaticFile,
  permissions: Permission[] = []
): CmisObject {
  return {
    objectId: file.fileId,
    name: file.filename,
    typeId: "cmis:document",
    baseTypeId: "cmis:document",
    parentId: file.folderId,
    path: `${file.folderId}/${file.filename}`,
    properties: {
      "cmis:objectId": file.fileId,
      "cmis:name": file.filename,
      "cmis:objectTypeId": "cmis:document",
      "cmis:baseTypeId": "cmis:document",
      "cmis:parentId": file.folderId,
      "cmis:contentStreamLength": file.size,
      "cmis:contentStreamMimeType": file.mimeType,
      "cmis:contentStreamFileName": file.filename,
      "cmis:creationDate": file.createdAt,
      "cmis:lastModificationDate": file.updatedAt
    },
    allowableActions: cmisAllowableActions("file", permissions, {
      canGetChildren: false,
      canGetContentStream: true,
      canDeleteObject: true
    }),
    contentStream: {
      length: file.size,
      mimeType: file.mimeType,
      filename: file.filename
    }
  };
}

export function cmisObjectFromContentRecord(
  content: ContentRecord,
  permissions: Permission[] = []
): CmisObject {
  const fieldProperties = Object.fromEntries(
    Object.entries(content.data).map(([fieldName, value]) => [
      `ecmp:${fieldName}`,
      isCmisPropertyValue(value) ? value : JSON.stringify(value)
    ])
  );

  return {
    objectId: content.contentId,
    name: content.contentId,
    typeId: cmisTypeIdForContentType(content.contentType),
    baseTypeId: "cmis:item",
    parentId: content.folderId,
    path: `${content.folderId}/${content.contentId}`,
    properties: {
      "cmis:objectId": content.contentId,
      "cmis:name": content.contentId,
      "cmis:objectTypeId": cmisTypeIdForContentType(content.contentType),
      "cmis:baseTypeId": "cmis:item",
      "cmis:parentId": content.folderId,
      "ecmp:contentType": content.contentType,
      "ecmp:schemaVersion": content.schemaVersion,
      "ecmp:version": content.version,
      "ecmp:status": content.status,
      "cmis:creationDate": content.createdAt,
      "cmis:lastModificationDate": content.updatedAt,
      ...fieldProperties
    },
    allowableActions: cmisAllowableActions(content.contentType, permissions, {
      canGetChildren: false,
      canGetContentStream: false,
      canDeleteObject: true
    })
  };
}

export function cmisAllowableActions(
  resource: PermissionResource,
  permissions: Permission[] = [],
  options: Partial<CmisAllowableActions> = {}
): CmisAllowableActions {
  const canRead = hasCmisPermission(permissions, resource, "read");
  const canCreateFolder = hasCmisPermission(permissions, "folder", "create");
  const canCreateDocument = hasCmisPermission(permissions, "file", "create");
  const canDeleteResource = hasCmisPermission(permissions, resource, "delete");

  return {
    canGetObject: canRead,
    canGetProperties: canRead,
    canGetChildren: Boolean(options.canGetChildren && canRead),
    canGetContentStream: Boolean(options.canGetContentStream && canRead),
    canCreateFolder,
    canCreateDocument,
    canDeleteObject: Boolean(options.canDeleteObject && canDeleteResource)
  };
}

export function cmisError(exception: CmisErrorCode, message: string): CmisErrorResponse {
  return { exception, message };
}

function commonTypeAttributes(
  localNamespace: string
): Pick<
  CmisTypeDefinition,
  | "localNamespace"
  | "queryable"
  | "controllablePolicy"
  | "controllableACL"
  | "fulltextIndexed"
  | "includedInSupertypeQuery"
  | "typeMutability"
> {
  return {
    localNamespace,
    queryable: false,
    controllablePolicy: false,
    controllableACL: false,
    fulltextIndexed: false,
    includedInSupertypeQuery: false,
    typeMutability: { create: false, update: false, delete: false }
  };
}

function commonPropertyDefinitions(): CmisPropertyDefinition[] {
  return [
    propertyDefinition("cmis:objectId", "Object ID", "id", true),
    propertyDefinition("cmis:name", "Name", "string", true, "readwrite"),
    propertyDefinition("cmis:objectTypeId", "Object Type ID", "id", true),
    propertyDefinition("cmis:baseTypeId", "Base Type ID", "id", true),
    propertyDefinition("cmis:parentId", "Parent ID", "id", false),
    propertyDefinition("cmis:creationDate", "Creation Date", "datetime", true),
    propertyDefinition("cmis:lastModificationDate", "Last Modification Date", "datetime", true)
  ];
}

function propertyDefinition(
  id: string,
  displayName: string,
  propertyType: CmisPropertyType,
  required: boolean,
  updatability: "readonly" | "readwrite" = "readonly"
): CmisPropertyDefinition {
  return {
    id,
    displayName,
    propertyType,
    required,
    updatability
  };
}

function cmisPropertyTypeForContentField(fieldType: ContentFieldType): CmisPropertyType {
  if (fieldType === "integer") {
    return "integer";
  }

  return "string";
}

function isCmisPropertyValue(value: unknown): value is CmisPropertyValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function hasCmisPermission(
  permissions: Permission[],
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.some((permission) => {
    const [ownedResource, ownedAction] = permission.split(":");

    return (
      (ownedResource === resource || ownedResource === "*") &&
      (ownedAction === action || ownedAction === "*")
    );
  });
}
