import { DEFAULT_MAX_SCHEMA_SOURCE_BYTES } from "@ecmp/shared-yaml";
import { describe, expect, it } from "vitest";

import {
  CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES_ENV,
  loadContentTypeSchemaConfig,
  parseMaxYamlSourceBytes
} from "./content-type-schema.config";

describe("content type schema config", () => {
  it("GIVEN no YAML size env WHEN config is loaded THEN it uses the safe default", () => {
    expect(loadContentTypeSchemaConfig({}).maxYamlSourceBytes).toBe(
      DEFAULT_MAX_SCHEMA_SOURCE_BYTES
    );
  });

  it("GIVEN a configured YAML size env WHEN config is loaded THEN it uses that limit", () => {
    expect(
      loadContentTypeSchemaConfig({ [CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES_ENV]: "1024" })
        .maxYamlSourceBytes
    ).toBe(1024);
  });

  it("GIVEN invalid YAML size env WHEN it is parsed THEN it rejects the value", () => {
    for (const value of ["0", "-1", "1.5", "not-a-number"]) {
      expect(() => parseMaxYamlSourceBytes(value)).toThrow(
        "CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES must be a positive safe integer."
      );
    }
  });
});
