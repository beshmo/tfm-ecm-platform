import { SYSTEM_SCHEMAS_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import { createContentTypeSchemaRecord } from "../domain/content-type-schema";
import { InMemoryContentTypeSchemaRepository } from "./in-memory-content-type-schema.repository";

describe("in-memory content type schema repository", () => {
  it("GIVEN a schema record WHEN it is saved THEN it can be found by name and version", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();
    const record = createContentTypeSchemaRecord(schemaDefinition("generic", "1.0"));

    await repository.save(record);

    await expect(repository.findByNameAndVersion("generic", "1.0")).resolves.toEqual(record);
  });

  it("GIVEN a saved schema record WHEN the returned record is mutated THEN stored state is unchanged", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")));

    const stored = await repository.findByNameAndVersion("generic", "1.0");
    stored!.definition.fields[0]!.required = false;

    const reread = await repository.findByNameAndVersion("generic", "1.0");

    expect(reread?.definition.fields[0]?.required).toBe(true);
  });

  it("GIVEN a saved schema record WHEN it is replaced THEN the same identity returns the replacement", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")));

    await repository.replace(
      createContentTypeSchemaRecord(schemaDefinition("generic", "1.0", "headline"))
    );

    const replaced = await repository.findByNameAndVersion("generic", "1.0");

    expect(replaced?.definition.fields.find((field) => field.name === "headline")).toEqual({
      name: "headline",
      type: "string",
      required: true
    });
    expect(
      replaced?.definition.fields.find((field) => field.name === "title")
    ).toBeUndefined();
  });

  it("GIVEN multiple active versions WHEN latest active is requested THEN semantic version ordering is used", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.2")));
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.10")));
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "2.0")));
    await repository.deactivate("generic", "2.0");

    const latest = await repository.findLatestActiveByName("generic");

    expect(latest?.definition.version).toBe("1.10");
  });

  it("GIVEN active and inactive schemas WHEN active schemas are listed THEN inactive schemas are excluded and results are sorted", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")));
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("article", "1.0")));
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("article", "2.0")));
    await repository.deactivate("article", "2.0");

    await expect(repository.listActive()).resolves.toEqual([
      { name: "article", version: "1.0", active: true },
      { name: "generic", version: "1.0", active: true }
    ]);
  });

  it("GIVEN an existing schema version WHEN it is deactivated THEN explicit lookup still returns the inactive record", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();
    const deactivatedAt = new Date("2026-06-01T11:00:00.000Z");
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")));

    const deactivated = await repository.deactivate("generic", "1.0", deactivatedAt);
    const explicit = await repository.findByNameAndVersion("generic", "1.0");

    expect(deactivated?.active).toBe(false);
    expect(explicit?.active).toBe(false);
    expect(explicit?.deactivatedAt).toEqual(deactivatedAt);
  });

  it("GIVEN a missing schema version WHEN it is deactivated THEN null is returned", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();

    await expect(repository.deactivate("generic", "1.0")).resolves.toBeNull();
  });

  it("GIVEN a saved schema WHEN no target folder is given THEN the definition defaults to the schema namespace folder", async () => {
    const repository = new InMemoryContentTypeSchemaRepository(
      new StubDefinitionIdGenerator(["CTD-generic"])
    );
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")));

    const definition = await repository.findDefinitionByName("generic");

    expect(definition).toMatchObject({
      contentTypeDefinitionId: "CTD-generic",
      folderId: SYSTEM_SCHEMAS_FOLDER_ID,
      name: "generic"
    });
    expect(definition?.versions).toEqual([{ name: "generic", version: "1.0", active: true }]);
  });

  it("GIVEN multiple versions of one name WHEN the definition is read THEN versions are grouped under one object", async () => {
    const repository = new InMemoryContentTypeSchemaRepository(
      new StubDefinitionIdGenerator(["CTD-generic"])
    );
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")));
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.2")));

    const definition = await repository.findDefinitionByName("generic");

    expect(definition?.contentTypeDefinitionId).toBe("CTD-generic");
    expect(definition?.versions.map((version) => version.version)).toEqual(["1.2", "1.0"]);
  });

  it("GIVEN definitions in a folder WHEN listed by folder THEN only that folder's definitions are returned", async () => {
    const repository = new InMemoryContentTypeSchemaRepository(
      new StubDefinitionIdGenerator(["CTD-article", "CTD-generic"])
    );
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("article", "1.0")), {
      folderId: "FLD-news"
    });
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")), {
      folderId: SYSTEM_SCHEMAS_FOLDER_ID
    });

    const inNews = await repository.listDefinitionsByFolderId("FLD-news");

    expect(inNews.map((definition) => definition.name)).toEqual(["article"]);
    await expect(repository.hasDefinitionsInFolder("FLD-news")).resolves.toBe(true);
    await expect(repository.hasDefinitionsInFolder("FLD-empty")).resolves.toBe(false);
  });

  it("GIVEN an existing definition WHEN it is moved THEN its folder changes but versions are preserved", async () => {
    const repository = new InMemoryContentTypeSchemaRepository(
      new StubDefinitionIdGenerator(["CTD-article"])
    );
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("article", "1.0")), {
      folderId: SYSTEM_SCHEMAS_FOLDER_ID
    });

    const moved = await repository.moveDefinition("article", "FLD-news");

    expect(moved).toMatchObject({ name: "article", folderId: "FLD-news" });
    expect(moved?.versions).toEqual([{ name: "article", version: "1.0", active: true }]);
    await expect(repository.findByNameAndVersion("article", "1.0")).resolves.not.toBeNull();
  });

  it("GIVEN a missing definition WHEN it is moved THEN null is returned", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();

    await expect(repository.moveDefinition("article", "FLD-news")).resolves.toBeNull();
  });
});

class StubDefinitionIdGenerator {
  private index = 0;

  constructor(private readonly ids: string[]) {}

  next(): `CTD-${string}` {
    const id = this.ids[this.index] ?? `CTD-${this.index}`;
    this.index += 1;

    return id as `CTD-${string}`;
  }
}

function schemaDefinition(name: string, version: string, fieldName = "title") {
  return {
    name,
    version,
    fields: [
      {
        name: fieldName,
        type: "string" as const,
        required: true
      }
    ]
  };
}
