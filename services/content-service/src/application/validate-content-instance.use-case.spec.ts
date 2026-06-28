import type { ContentTypeSchemaDefinition } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import { InMemoryContentTypeSchemaReader } from "../infrastructure/in-memory-content-type-schema.reader";
import { ContentTypeSchemaNotFoundError } from "./content-validation.errors";
import { ValidateContentInstanceUseCase } from "./validate-content-instance.use-case";

describe("validate content instance use case", () => {
  it("GIVEN no schema version WHEN content is validated THEN latest active schema is used by default", async () => {
    const useCase = new ValidateContentInstanceUseCase(
      new InMemoryContentTypeSchemaReader([
        schema("article", "1.0", { title: { type: "string", required: true } }),
        schema("article", "1.2", {
          title: { type: "string", required: true },
          priority: { type: "integer", required: true }
        })
      ])
    );

    const result = await useCase.execute({
      contentType: "article",
      data: { title: "Welcome" }
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      field: "priority",
      code: "REQUIRED_FIELD_MISSING",
      message: "priority is required."
    });
  });

  it("GIVEN an explicit schema version WHEN content is validated THEN the requested schema version is used", async () => {
    const useCase = new ValidateContentInstanceUseCase(
      new InMemoryContentTypeSchemaReader([
        schema("article", "1.0", { title: { type: "string", required: true } }),
        schema("article", "2.0", {
          title: { type: "string", required: true },
          priority: { type: "integer", required: true }
        })
      ])
    );

    const result = await useCase.execute({
      contentType: "article",
      schemaVersion: "1.0",
      data: { title: "Welcome" }
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("GIVEN a missing schema WHEN content is validated THEN it reports a schema-not-found application error", async () => {
    const useCase = new ValidateContentInstanceUseCase(
      new InMemoryContentTypeSchemaReader()
    );

    await expect(
      useCase.execute({
        contentType: "article",
        data: { title: "Welcome" }
      })
    ).rejects.toBeInstanceOf(ContentTypeSchemaNotFoundError);
  });

  it("GIVEN multiple invalid fields WHEN content is validated THEN all validation errors are returned together", async () => {
    const useCase = new ValidateContentInstanceUseCase(
      new InMemoryContentTypeSchemaReader([
        schema("article", "1.0", {
          title: { type: "string", required: true },
          publishDate: { type: "date", required: false }
        })
      ])
    );

    const result = await useCase.execute({
      contentType: "article",
      data: {
        title: 10,
        publishDate: "2026-02-30",
        summary: "Unexpected"
      }
    });

    expect(result).toEqual({
      valid: false,
      errors: [
        {
          field: "summary",
          code: "UNKNOWN_FIELD",
          message: "summary is not defined by content type article."
        },
        {
          field: "title",
          code: "INVALID_STRING",
          message: "title must be a string."
        },
        {
          field: "publishDate",
          code: "INVALID_DATE",
          message: "publishDate must be a valid date using YYYY-MM-DD format."
        }
      ]
    });
  });
});

function schema(
  name: string,
  version: string,
  fields: ContentTypeSchemaDefinition["fields"]
): ContentTypeSchemaDefinition {
  return { name, version, fields };
}
