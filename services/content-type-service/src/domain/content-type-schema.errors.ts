import type { ContentTypeName, ContentTypeVersion } from "@ecmp/shared-types";

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
