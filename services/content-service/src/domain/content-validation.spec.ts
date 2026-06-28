import type { ContentTypeSchemaDefinition } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import { validateContentInstanceData } from "./content-validation";

describe("content instance validation domain", () => {
  const schema: ContentTypeSchemaDefinition = {
    name: "article",
    version: "1.0",
    fields: {
      title: { type: "string", required: true },
      priority: { type: "integer", required: false },
      publishDate: { type: "date", required: false },
      publishTime: { type: "time", required: false }
    }
  };

  it("GIVEN a valid content instance WHEN it is validated THEN it returns valid", () => {
    const result = validateContentInstanceData(schema, {
      title: "",
      priority: 3,
      publishDate: "2026-06-28",
      publishTime: "14:30:00"
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("GIVEN a missing required field WHEN it is validated THEN it returns REQUIRED_FIELD_MISSING", () => {
    const result = validateContentInstanceData(schema, {
      priority: 1
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "title",
      code: "REQUIRED_FIELD_MISSING",
      message: "title is required."
    });
  });

  it("GIVEN an unknown field WHEN it is validated THEN it returns UNKNOWN_FIELD", () => {
    const result = validateContentInstanceData(schema, {
      title: "Welcome",
      summary: "Extra data"
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "summary",
      code: "UNKNOWN_FIELD",
      message: "summary is not defined by content type article."
    });
  });

  it("GIVEN invalid values for each supported type WHEN validated THEN type-specific errors are returned", () => {
    const result = validateContentInstanceData(schema, {
      title: 123,
      priority: 1.5,
      publishDate: "2026-02-30",
      publishTime: "24:01:00"
    });

    expect(result.errors).toEqual([
      {
        field: "title",
        code: "INVALID_STRING",
        message: "title must be a string."
      },
      {
        field: "priority",
        code: "INVALID_INTEGER",
        message: "priority must be a whole number."
      },
      {
        field: "publishDate",
        code: "INVALID_DATE",
        message: "publishDate must be a valid date using YYYY-MM-DD format."
      },
      {
        field: "publishTime",
        code: "INVALID_TIME",
        message: "publishTime must be a valid time using HH:mm:ss format."
      }
    ]);
  });

  it("GIVEN optional fields are absent WHEN validated THEN validation succeeds", () => {
    const result = validateContentInstanceData(schema, {
      title: "Only required data"
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("GIVEN dangerous object keys WHEN validated THEN validation rejects them", () => {
    const data = JSON.parse('{"title":"Welcome","__proto__":"polluted"}') as unknown;

    const result = validateContentInstanceData(schema, data);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "__proto__",
      code: "FORBIDDEN_FIELD_NAME",
      message: "__proto__ is not an allowed field name."
    });
  });

  it("GIVEN a non-object payload WHEN validated THEN validation rejects the content data", () => {
    const result = validateContentInstanceData(schema, []);

    expect(result).toEqual({
      valid: false,
      errors: [
        {
          field: "$",
          code: "INVALID_CONTENT_DATA",
          message: "Content data must be a plain object."
        }
      ]
    });
  });

  it("GIVEN a present optional null field WHEN validated THEN validation rejects the field value", () => {
    const result = validateContentInstanceData(schema, {
      title: "Welcome",
      priority: null
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "priority",
      code: "INVALID_INTEGER",
      message: "priority must be a whole number."
    });
  });
});
