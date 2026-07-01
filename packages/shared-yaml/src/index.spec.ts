import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_SCHEMA_SOURCE_BYTES,
  SchemaValidationError,
  StrictYamlSchemaParser
} from "./index";

describe("strict YAML schema parser", () => {
  const parser = new StrictYamlSchemaParser();

  it("GIVEN a valid ordered YAML schema WHEN it is parsed THEN it returns a normalized ordered field array", () => {
    const schema = parser.parse(`
name: generic
version: 1.0
fields:
  - name: title
    type: string
    required: true
  - name: priority
    type: integer
  - name: publishDate
    type: date
  - name: publishTime
    type: time
`);

    expect(schema).toEqual({
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

  it("GIVEN an ordered YAML schema WHEN field order differs THEN the normalized fields preserve the YAML sequence order", () => {
    const schema = parser.parse(`
name: generic
version: 1.0
fields:
  - name: priority
    type: integer
  - name: title
    type: string
    required: true
`);

    expect(schema.fields.map((field) => field.name)).toEqual(["priority", "title"]);
  });

  it("GIVEN an optional required flag WHEN it is omitted THEN the normalized field defaults required to false", () => {
    const schema = parser.parse(`
name: generic
version: 1.0
fields:
  - name: title
    type: string
`);

    expect(schema.fields[0]).toEqual({ name: "title", type: "string", required: false });
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
  - name: title
    type: string
`)
    ).toThrowError(SchemaValidationError);
  });

  it("GIVEN a legacy field mapping WHEN it is parsed THEN it rejects fields that are not an ordered sequence", () => {
    try {
      parser.parse(`
name: generic
version: 1.0
fields:
  title:
    type: string
    required: true
`);
      throw new Error("Expected SchemaValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaValidationError);
      expect((error as SchemaValidationError).issues).toContain(
        "Schema fields must be an ordered sequence, not a mapping."
      );
    }
  });

  it("GIVEN empty field collections WHEN they are parsed THEN it rejects the schema", () => {
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
  });

  it("GIVEN a field entry without a name WHEN it is parsed THEN it rejects the field", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  - type: string
`)
    ).toThrowError(SchemaValidationError);
  });

  it("GIVEN duplicate field names WHEN they are parsed THEN it rejects the schema", () => {
    try {
      parser.parse(`
name: generic
version: 1.0
fields:
  - name: title
    type: string
  - name: title
    type: integer
`);
      throw new Error("Expected SchemaValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaValidationError);
      expect((error as SchemaValidationError).issues).toContain("Duplicate field name 'title'.");
    }
  });

  it("GIVEN an unsupported field type WHEN it is parsed THEN it rejects the field", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  - name: title
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
  - name: title
    type: string
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN unexpected field entry keys WHEN it is parsed THEN it rejects the field definition", () => {
    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  - name: title
    type: string
    description: not allowed
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN prototype pollution field names WHEN it is parsed THEN it rejects unsafe names", () => {
    for (const unsafeKey of ["__proto__", "prototype", "constructor"]) {
      expect(() =>
        parser.parse(`
name: generic
version: 1.0
fields:
  - name: ${unsafeKey}
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
  - name: bad-name
    type: string
`)
    ).toThrow(SchemaValidationError);

    expect(() =>
      parser.parse(`
name: generic
version: 1.0
fields:
  - name: ""
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
  - name: title
    type: string
    required: &req true
  - name: headline
    type: string
    required: *req
`)
    ).toThrow(SchemaValidationError);
  });

  it("GIVEN an oversized YAML source WHEN it is parsed THEN it rejects the input before parsing", () => {
    const oversizedSource = `name: generic\nversion: 1.0\nfields:\n  - name: title\n    type: string\n${"a".repeat(70 * 1024)}`;

    expect(() => parser.parse(oversizedSource)).toThrow(SchemaValidationError);
  });

  it("GIVEN no parser size option WHEN it is constructed THEN the default source size limit is used", () => {
    const oversizedSource = `name: generic\nversion: 1.0\nfields:\n  - name: title\n    type: string\n${"a".repeat(DEFAULT_MAX_SCHEMA_SOURCE_BYTES)}`;

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
  - name: title
    type: string
`)
      ).toThrow(SchemaValidationError);
    }
  });
});
