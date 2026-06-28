import { describe, expect, it } from "vitest";

import type {
  ContentId,
  ContentInstanceValidationInput,
  ContentTypeSchemaDefinition,
  ContentValidationResult,
  Permission
} from "./index";

describe("shared types", () => {
  it("supports prefixed content IDs and resource permissions", () => {
    const contentId: ContentId = "RCD-123";
    const permission: Permission = "folder:read";

    expect(contentId).toBe("RCD-123");
    expect(permission).toBe("folder:read");
  });

  it("GIVEN a normalized content type schema WHEN fields are defined THEN simple field types are supported", () => {
    const schema: ContentTypeSchemaDefinition = {
      name: "generic",
      version: "1.0",
      fields: {
        title: { type: "string", required: true },
        priority: { type: "integer", required: false },
        publishDate: { type: "date", required: false },
        publishTime: { type: "time", required: false }
      }
    };

    expect(schema.fields["title"]?.required).toBe(true);
    expect(schema.fields["priority"]?.type).toBe("integer");
  });

  it("GIVEN a content validation result WHEN validation fails THEN structured errors describe invalid fields", () => {
    const input: ContentInstanceValidationInput = {
      contentType: "article",
      data: { publishDate: "tomorrow" }
    };
    const result: ContentValidationResult = {
      valid: false,
      errors: [
        {
          field: "publishDate",
          code: "INVALID_DATE",
          message: "publishDate must be a valid date using YYYY-MM-DD format."
        }
      ]
    };

    expect(input.schemaVersion).toBeUndefined();
    expect(result.errors[0]?.code).toBe("INVALID_DATE");
  });
});
