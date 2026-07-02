import type { ContentTypeName, ContentTypeVersion, FolderId } from "@ecmp/shared-types";

export class ContentTypeSchemaAlreadyExistsError extends Error {
  constructor(name: ContentTypeName, version: ContentTypeVersion) {
    super(`Content type schema '${name}' version '${version}' already exists.`);
    this.name = "ContentTypeSchemaAlreadyExistsError";
  }
}

export class ContentTypeSchemaNotFoundError extends Error {
  constructor(name: ContentTypeName, version?: ContentTypeVersion) {
    super(
      version
        ? `Content type schema '${name}' version '${version}' was not found.`
        : `Content type schema '${name}' was not found.`
    );
    this.name = "ContentTypeSchemaNotFoundError";
  }
}

export class ContentTypeSchemaInactiveError extends Error {
  constructor(name: ContentTypeName, version: ContentTypeVersion) {
    super(`Content type schema '${name}' version '${version}' is inactive.`);
    this.name = "ContentTypeSchemaInactiveError";
  }
}

export class ContentTypeSchemaMismatchError extends Error {
  constructor() {
    super("Content type schema name or version does not match the requested schema.");
    this.name = "ContentTypeSchemaMismatchError";
  }
}

export class ContentTypeDefinitionNotFoundError extends Error {
  constructor(name: ContentTypeName) {
    super(`Content type definition '${name}' was not found.`);
    this.name = "ContentTypeDefinitionNotFoundError";
  }
}

export class SchemaFolderNotFoundError extends Error {
  constructor(folderId: FolderId) {
    super(`Schema folder '${folderId}' was not found.`);
    this.name = "SchemaFolderNotFoundError";
  }
}

export class SchemaNamespaceConflictError extends Error {
  constructor(folderId: FolderId) {
    super(`Folder '${folderId}' is outside the '/system/schemas' schema namespace.`);
    this.name = "SchemaNamespaceConflictError";
  }
}
