import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_SCHEMA_SOURCE_BYTES,
  SchemaValidationError,
  StrictYamlSchemaParser
} from "./index";

describe("strict YAML schema parser", () => {
  const parser = new StrictYamlSchemaParser();

  it("GIVEN a valid YAML schema WHEN it is parsed THEN it returns a normalized JSON-compatible schema", () => {
    const schema = parser.parse(`
name: generic
version: 1.0
fields:
  title:
    type: string
    required: true
  priority:
    type: integer
  publishDate:
    type: date
  publishTime:
    type: time
`);

    expect(schema).toEqual({
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

  it("GIVEN invalid YAML WHEN it is parsed THEN it returns a sanitized validation error", () => {
    expect(() => parser.parse("name: [")).toThrow(SchemaValidationError);

    try {
      parser.parse("name: [");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaValidationError);
      expect((error as Error).message).toBe("Content type schema is invalid.");
      expect((error as SchemaValidationError).issues).toEqual([
        "Schema source must be valid YAML."
      ]);
      expect((error as SchemaValidationError).issues.join(" ")).not.toContain("node_modules");
      expect((error as SchemaValidationError).issues.join(" ")).not.toContain("C:\\");
    }
  });

  it("GIVEN a schema with missing required sections WHEN it is parsed THEN it rejects the schema", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
`)
    ).toThrowError(SchemaValidationError);
  });

  it("GIVEN a schema without name or version WHEN it is parsed THEN it rejects the required metadata", () => {
    expect(() =>
      parser.parse(`
fields:
  title:
    type: string
`)
    ).toThrowError(SchemaValidationError);
  });

  it("GIVEN invalid fields shapes WHEN they are parsed THEN it rejects the schema", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields: []
`)
    ).toThrowError(SchemaValidationError);

    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields: {}
`)
    ).toThrowError(SchemaValidationError);

    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  title: string
`)
    ).toThrowError(SchemaValidationError);
  });

  it("GIVEN an unsupported field type WHEN it is parsed THEN it rejects the field", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  title:
    type: markdown
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN unexpected schema keys WHEN it is parsed THEN it rejects the schema", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
description: not allowed
fields:
  title:
    type: string
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN unexpected field keys WHEN it is parsed THEN it rejects the field definition", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  title:
    type: string
    description: not allowed
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN prototype pollution keys WHEN it is parsed THEN it rejects unsafe keys", () => {
    for (const unsafeKey of ["__proto__", "prototype", "constructor"]) {
      expect(() =>
        parser.parse(`
name: generic
version: 1.0
fields:
  ${unsafeKey}:
    type: string
`)
      ).toThrow(SchemaValidationError);
    }
  });

  it("GIVEN unsafe field names WHEN they are parsed THEN it rejects identifier-like violations", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  bad-name:
    type: string
`)
    ).toThrow(SchemaValidationError);

    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  "":
    type: string
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN YAML anchors or aliases WHEN the schema is parsed THEN it rejects alias-based input", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  title: &titleField
    type: string
  headline: *titleField
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN an oversized YAML source WHEN it is parsed THEN it rejects the input before parsing", () => {
    const oversizedSource = `name: generic\nversion: 1.0\nfields:\n  title:\n    type: string\n${"a".repeat(70 * 1024)}`;

    expect(() => parser.parse(oversizedSource)).toThrow(SchemaValidationError);
  });

  it("GIVEN no parser size option WHEN it is constructed THEN the default source size limit is used", () => {
    const oversizedSource = `name: generic\nversion: 1.0\nfields:\n  title:\n    type: string\n${"a".repeat(DEFAULT_MAX_SCHEMA_SOURCE_BYTES)}`;

    expect(() => new StrictYamlSchemaParser().parse(oversizedSource)).toThrow(
      SchemaValidationError
    );
  });

  it("GIVEN a configured parser size limit WHEN source exceeds it THEN it rejects before parsing", () => {
    const configuredParser = new StrictYamlSchemaParser({ maxSourceBytes: 32 });

    expect(() => configuredParser.parse("name: generic\nversion: 1.0\nfields:")).toThrow(
      SchemaValidationError
    );
  });

  it("GIVEN an invalid parser size option WHEN it is constructed THEN it rejects the option", () => {
    expect(() => new StrictYamlSchemaParser({ maxSourceBytes: 0 })).toThrow(RangeError);
  });

  it("GIVEN an internal platform type name WHEN it is parsed THEN it rejects the reserved name", () => {
    for (const reservedName of ["folder", "folders", "static-file", "static-files", "file", "files"]) {
      expect(() =>
        parser.parse(`
name: ${reservedName}
version: 1.0
fields:
  title:
    type: string
`)
      ).toThrow(SchemaValidationError);
    }
  });
});
