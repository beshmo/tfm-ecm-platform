import type { ContentTypeSchemaDefinition } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import { validateContentInstanceData } from "./content-validation";

describe("content instance validation domain", () => {
  const schema: ContentTypeSchemaDefinition = {
    name: "article",
    version: "1.0",
    fields: [
      { name: "title", type: "string", required: true },
      { name: "priority", type: "integer", required: false },
      { name: "publishDate", type: "date", required: false },
      { name: "publishTime", type: "time", required: false }
    ]
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

  it("GIVEN a present optional undefined field WHEN validated THEN validation rejects the field value", () => {
    const result = validateContentInstanceData(schema, {
      title: "Welcome",
      priority: undefined
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "priority",
      code: "INVALID_INTEGER",
      message: "priority must be a whole number."
    });
  });

  it("GIVEN dangerous object keys WHEN validated THEN validation rejects them", () => {
    for (const forbiddenKey of ["__proto__", "prototype", "constructor"]) {
      const data = JSON.parse(`{"title":"Welcome","${forbiddenKey}":"polluted"}`) as unknown;

      const result = validateContentInstanceData(schema, data);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: forbiddenKey,
        code: "FORBIDDEN_FIELD_NAME",
        message: `${forbiddenKey} is not an allowed field name.`
      });
    }
  });

  it("GIVEN non-object payloads WHEN validated THEN validation rejects the content data", () => {
    for (const data of [[], "title", 42, null]) {
      const result = validateContentInstanceData(schema, data);

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
    }
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

  it("GIVEN invalid date and time formats WHEN validated THEN strict formats are required", () => {
    const result = validateContentInstanceData(schema, {
      title: "Welcome",
      publishDate: "2026-6-28",
      publishTime: "9:30:00"
    });

    expect(result.errors).toEqual([
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

  describe("extended field types", () => {
    const extendedSchema: ContentTypeSchemaDefinition = {
      name: "article",
      version: "1.0",
      fields: [
        { name: "featured", type: "boolean", required: false },
        { name: "publishMoment", type: "datetime", required: false },
        { name: "rating", type: "decimal", required: false },
        { name: "body", type: "html", required: false },
        { name: "canonicalUrl", type: "uri", required: false }
      ]
    };

    it("GIVEN valid extended field values WHEN validated THEN validation succeeds", () => {
      const result = validateContentInstanceData(extendedSchema, {
        featured: true,
        publishMoment: "2026-07-01T14:30:00+02:00",
        rating: 4.5,
        body: "<p>Hello</p>",
        canonicalUrl: "https://example.com/article"
      });

      expect(result).toEqual({ valid: true, errors: [] });
    });

    it("GIVEN a datetime with a Z designator WHEN validated THEN validation succeeds", () => {
      const result = validateContentInstanceData(extendedSchema, {
        publishMoment: "2026-07-01T12:30:00Z"
      });

      expect(result).toEqual({ valid: true, errors: [] });
    });

    it("GIVEN a whole-number decimal WHEN validated THEN it is accepted as a finite number", () => {
      const result = validateContentInstanceData(extendedSchema, { rating: 5 });

      expect(result).toEqual({ valid: true, errors: [] });
    });

    it("GIVEN invalid extended field values WHEN validated THEN type-specific errors are returned", () => {
      const result = validateContentInstanceData(extendedSchema, {
        featured: "true",
        publishMoment: "2026-07-01T12:30:00",
        rating: Number.POSITIVE_INFINITY,
        body: 123,
        canonicalUrl: "/relative/path"
      });

      expect(result.errors).toEqual([
        {
          field: "featured",
          code: "INVALID_BOOLEAN",
          message: "featured must be a boolean."
        },
        {
          field: "publishMoment",
          code: "INVALID_DATETIME",
          message:
            "publishMoment must be a timestamp with an explicit timezone offset or Z designator."
        },
        {
          field: "rating",
          code: "INVALID_DECIMAL",
          message: "rating must be a finite number."
        },
        {
          field: "body",
          code: "INVALID_HTML",
          message: "body must be a string."
        },
        {
          field: "canonicalUrl",
          code: "INVALID_URI",
          message: "canonicalUrl must be an absolute URI."
        }
      ]);
    });

    it("GIVEN a datetime without timezone information WHEN validated THEN it is rejected", () => {
      const result = validateContentInstanceData(extendedSchema, {
        publishMoment: "2026-07-01 12:30:00"
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "publishMoment",
        code: "INVALID_DATETIME",
        message:
          "publishMoment must be a timestamp with an explicit timezone offset or Z designator."
      });
    });

    it("GIVEN a decimal supplied as a string WHEN validated THEN it is rejected without coercion", () => {
      const result = validateContentInstanceData(extendedSchema, { rating: "4.5" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: "rating",
        code: "INVALID_DECIMAL",
        message: "rating must be a finite number."
      });
    });
  });
});
