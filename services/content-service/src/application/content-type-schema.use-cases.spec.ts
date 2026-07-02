import { SYSTEM_SCHEMAS_FOLDER_ID } from "@ecmp/shared-types";
import { StrictYamlSchemaParser } from "@ecmp/shared-yaml";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ContentTypeDefinitionNotFoundError,
  ContentTypeSchemaAlreadyExistsError,
  ContentTypeSchemaInactiveError,
  ContentTypeSchemaMismatchError,
  ContentTypeSchemaNotFoundError,
  SchemaFolderNotFoundError,
  SchemaNamespaceConflictError
} from "../domain/content-type-schema.errors";
import {
  createSystemFolder,
  createSystemSchemasFolder
} from "../domain/system-folder";
import { createRootFolder } from "../domain/folder";
import { InMemoryContentTypeSchemaRepository } from "../infrastructure/in-memory-content-type-schema.repository";
import { InMemoryFolderRepository } from "../infrastructure/in-memory-folder.repository";
import {
  CreateContentTypeSchemaUseCase,
  DeactivateContentTypeSchemaVersionUseCase,
  GetContentTypeSchemaUseCase,
  GetContentTypeSchemaVersionUseCase,
  ListContentTypeDefinitionsUseCase,
  ListContentTypeSchemasUseCase,
  MoveContentTypeDefinitionUseCase,
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

describe("content type definition administration use cases", () => {
  let repository: InMemoryContentTypeSchemaRepository;
  let folderRepository: InMemoryFolderRepository;
  let createSchema: CreateContentTypeSchemaUseCase;
  let listDefinitions: ListContentTypeDefinitionsUseCase;
  let moveDefinition: MoveContentTypeDefinitionUseCase;

  beforeEach(() => {
    const parser = new StrictYamlSchemaParser();

    repository = new InMemoryContentTypeSchemaRepository();
    folderRepository = new InMemoryFolderRepository([
      createRootFolder(),
      createSystemFolder(),
      createSystemSchemasFolder()
    ]);
    createSchema = new CreateContentTypeSchemaUseCase(parser, repository);
    listDefinitions = new ListContentTypeDefinitionsUseCase(repository);
    moveDefinition = new MoveContentTypeDefinitionUseCase(repository, folderRepository);
  });

  it("GIVEN a schema created in the schema namespace WHEN definitions are listed by folder THEN it is returned there", async () => {
    await createSchema.execute(schemaSource("article", "1.0"), SYSTEM_SCHEMAS_FOLDER_ID);

    const definitions = await listDefinitions.execute(SYSTEM_SCHEMAS_FOLDER_ID);

    expect(definitions.map((definition) => definition.name)).toEqual(["article"]);
    expect(definitions[0]?.folderId).toBe(SYSTEM_SCHEMAS_FOLDER_ID);
  });

  it("GIVEN a schema folder subfolder WHEN a definition is moved into it THEN its location changes", async () => {
    await createSchema.execute(schemaSource("article", "1.0"), SYSTEM_SCHEMAS_FOLDER_ID);
    const newsFolder = await folderRepository.save({
      folderId: "FLD-news",
      name: "news",
      parentFolderId: SYSTEM_SCHEMAS_FOLDER_ID,
      path: "/system/schemas/news",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const moved = await moveDefinition.execute("article", newsFolder.folderId);

    expect(moved.folderId).toBe("FLD-news");
    expect(moved.versions).toEqual([{ name: "article", version: "1.0", active: true }]);
  });

  it("GIVEN a missing definition WHEN it is moved THEN it reports the definition not found", async () => {
    await expect(
      moveDefinition.execute("article", SYSTEM_SCHEMAS_FOLDER_ID)
    ).rejects.toBeInstanceOf(ContentTypeDefinitionNotFoundError);
  });

  it("GIVEN a missing target folder WHEN a definition is moved THEN it reports the schema folder not found", async () => {
    await createSchema.execute(schemaSource("article", "1.0"), SYSTEM_SCHEMAS_FOLDER_ID);

    await expect(moveDefinition.execute("article", "FLD-missing")).rejects.toBeInstanceOf(
      SchemaFolderNotFoundError
    );
  });

  it("GIVEN a target folder outside the schema namespace WHEN a definition is moved THEN it is rejected as a conflict", async () => {
    await createSchema.execute(schemaSource("article", "1.0"), SYSTEM_SCHEMAS_FOLDER_ID);
    const outside = await folderRepository.save({
      folderId: "FLD-outside",
      name: "outside",
      parentFolderId: "FLD-root",
      path: "/outside",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await expect(moveDefinition.execute("article", outside.folderId)).rejects.toBeInstanceOf(
      SchemaNamespaceConflictError
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
