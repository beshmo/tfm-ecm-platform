import { DEFAULT_MAX_SCHEMA_SOURCE_BYTES } from "@ecmp/shared-yaml";

export const CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES_ENV = "CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES";

export interface ContentTypeSchemaConfig {
  maxYamlSourceBytes: number;
}

export function loadContentTypeSchemaConfig(
  env: NodeJS.ProcessEnv = process.env
): ContentTypeSchemaConfig {
  return {
    maxYamlSourceBytes: parseMaxYamlSourceBytes(env[CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES_ENV])
  };
}

export function parseMaxYamlSourceBytes(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_MAX_SCHEMA_SOURCE_BYTES;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(
      `${CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES_ENV} must be a positive safe integer.`
    );
  }

  return parsed;
}
