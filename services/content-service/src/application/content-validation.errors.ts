import type { ContentTypeName, ContentTypeVersion } from "@ecmp/shared-types";

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
