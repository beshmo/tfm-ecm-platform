import { StrictYamlSchemaParser } from "@ecmp/shared-yaml";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ContentTypeSchemaAlreadyExistsError,
  ContentTypeSchemaInactiveError,
  ContentTypeSchemaMismatchError,
  ContentTypeSchemaNotFoundError
} from "../domain/content-type-schema.errors";
import { InMemoryContentTypeSchemaRepository } from "../infrastructure/in-memory-content-type-schema.repository";
import {
  CreateContentTypeSchemaUseCase,
  DeactivateContentTypeSchemaVersionUseCase,
  GetContentTypeSchemaUseCase,
  GetContentTypeSchemaVersionUseCase,
  ListContentTypeSchemasUseCase,
  ReplaceContentTypeSchemaVersionUseCase
} from "./content-type-schema.use-cases";

describe("content type schema use cases", () => {
  let repository: InMemoryContentTypeSchemaRepository;
  let createSchema: CreateContentTypeSchemaUseCase;
  let replaceSchema: ReplaceContentTypeSchemaVersionUseCase;
  let getLatestSchema: GetContentTypeSchemaUseCase;
  let getSchemaVersion: GetContentTypeSchemaVersionUseCase;
  let listSchemas: ListContentTypeSchemasUseCase;
  let deactivateSchema: DeactivateContentTypeSchemaVersionUseCase;

  beforeEach(() => {
    const parser = new StrictYamlSchemaParser();

    repository = new InMemoryContentTypeSchemaRepository();
    createSchema = new CreateContentTypeSchemaUseCase(parser, repository);
    replaceSchema = new ReplaceContentTypeSchemaVersionUseCase(parser, repository);
    getLatestSchema = new GetContentTypeSchemaUseCase(repository);
    getSchemaVersion = new GetContentTypeSchemaVersionUseCase(repository);
    listSchemas = new ListContentTypeSchemasUseCase(repository);
    deactivateSchema = new DeactivateContentTypeSchemaVersionUseCase(repository);
  });

  it("GIVEN a valid YAML schema WHEN it is created THEN the normalized schema is stored", async () => {
    const schema = await createSchema.execute(schemaSource("generic", "1.0"));

    expect(schema).toEqual({
      name: "generic",
      version: "1.0",
      fields: [{ name: "title", type: "string", required: true }]
    });
  });

  it("GIVEN an existing schema version WHEN the same name and version is created THEN it rejects the duplicate", async () => {
    await createSchema.execute(schemaSource("generic", "1.0"));

    await expect(createSchema.execute(schemaSource("generic", "1.0"))).rejects.toBeInstanceOf(
      ContentTypeSchemaAlreadyExistsError
    );
  });

  it("GIVEN an existing active schema version WHEN it is replaced THEN the stored definition changes", async () => {
    await createSchema.execute(schemaSource("generic", "1.0"));

    const replaced = await replaceSchema.execute(
      "generic",
      "1.0",
      schemaSource("generic", "1.0", "headline")
    );

    expect(replaced.fields.find((field) => field.name === "headline")).toEqual({
      name: "headline",
      type: "string",
      required: true
    });
  });

  it("GIVEN a replace request WHEN YAML name or version does not match THEN it rejects the mismatch", async () => {
    await createSchema.execute(schemaSource("generic", "1.0"));

    await expect(
      replaceSchema.execute("generic", "1.0", schemaSource("article", "1.0"))
    ).rejects.toBeInstanceOf(ContentTypeSchemaMismatchError);

    await expect(
      replaceSchema.execute("generic", "1.0", schemaSource("generic", "2.0"))
    ).rejects.toBeInstanceOf(ContentTypeSchemaMismatchError);
  });

  it("GIVEN a missing schema version WHEN it is replaced THEN it reports not found", async () => {
    await expect(
      replaceSchema.execute("generic", "1.0", schemaSource("generic", "1.0"))
    ).rejects.toBeInstanceOf(ContentTypeSchemaNotFoundError);
  });

  it("GIVEN multiple active versions WHEN latest is requested THEN the highest active version is returned", async () => {
    await createSchema.execute(schemaSource("generic", "1.0"));
    await createSchema.execute(schemaSource("generic", "1.2"));
    await createSchema.execute(schemaSource("generic", "1.10"));

    const latest = await getLatestSchema.execute("generic");

    expect(latest.version).toBe("1.10");
  });

  it("GIVEN a deactivated latest version WHEN latest is requested THEN it returns the highest active version", async () => {
    await createSchema.execute(schemaSource("generic", "1.0"));
    await createSchema.execute(schemaSource("generic", "2.0"));
    await deactivateSchema.execute("generic", "2.0");

    const latest = await getLatestSchema.execute("generic");

    expect(latest.version).toBe("1.0");
  });

  it("GIVEN a deactivated schema version WHEN the specific version is requested THEN it is still retrievable", async () => {
    await createSchema.execute(schemaSource("generic", "1.0"));
    await deactivateSchema.execute("generic", "1.0");

    const schema = await getSchemaVersion.execute("generic", "1.0");

    expect(schema.version).toBe("1.0");
  });

  it("GIVEN active and inactive schema versions WHEN schemas are listed THEN only active summaries are returned", async () => {
    await createSchema.execute(schemaSource("article", "1.0"));
    await createSchema.execute(schemaSource("generic", "1.0"));
    await deactivateSchema.execute("article", "1.0");

    await expect(listSchemas.execute()).resolves.toEqual([
      { name: "generic", version: "1.0", active: true }
    ]);
  });

  it("GIVEN an active schema version WHEN it is deactivated THEN future replacements are rejected", async () => {
    await createSchema.execute(schemaSource("generic", "1.0"));
    await deactivateSchema.execute("generic", "1.0");

    await expect(
      replaceSchema.execute("generic", "1.0", schemaSource("generic", "1.0", "headline"))
    ).rejects.toBeInstanceOf(ContentTypeSchemaInactiveError);
  });

  it("GIVEN a missing schema version WHEN it is deactivated THEN it reports not found", async () => {
    await expect(deactivateSchema.execute("generic", "1.0")).rejects.toBeInstanceOf(
      ContentTypeSchemaNotFoundError
    );
  });

  it("GIVEN a missing schema WHEN it is retrieved THEN it reports not found", async () => {
    await expect(getLatestSchema.execute("generic")).rejects.toBeInstanceOf(
      ContentTypeSchemaNotFoundError
    );
  });
});

function schemaSource(name: string, version: string, fieldName = "title"): string {
  return `
name: ${name}
version: ${version}
fields:
  - name: ${fieldName}
    type: string
    required: true
`;
}
