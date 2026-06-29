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
    stored!.definition.fields["title"]!.required = false;

    const reread = await repository.findByNameAndVersion("generic", "1.0");

    expect(reread?.definition.fields["title"]?.required).toBe(true);
  });

  it("GIVEN a saved schema record WHEN it is replaced THEN the same identity returns the replacement", async () => {
    const repository = new InMemoryContentTypeSchemaRepository();
    await repository.save(createContentTypeSchemaRecord(schemaDefinition("generic", "1.0")));

    await repository.replace(
      createContentTypeSchemaRecord(schemaDefinition("generic", "1.0", "headline"))
    );

    const replaced = await repository.findByNameAndVersion("generic", "1.0");

    expect(replaced?.definition.fields["headline"]).toEqual({
      type: "string",
      required: true
    });
    expect(replaced?.definition.fields["title"]).toBeUndefined();
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
});

function schemaDefinition(name: string, version: string, fieldName = "title") {
  return {
    name,
    version,
    fields: {
      [fieldName]: {
        type: "string" as const,
        required: true
      }
    }
  };
}
