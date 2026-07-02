/**
 * Dependency-injection tokens shared across provider modules. Declared in a
 * leaf module so provider files can reference each other's repositories without
 * creating a circular import between the provider modules themselves.
 */
export const FOLDER_REPOSITORY = Symbol("FOLDER_REPOSITORY");
export const CONTENT_TYPE_SCHEMA_REPOSITORY = Symbol("CONTENT_TYPE_SCHEMA_REPOSITORY");
