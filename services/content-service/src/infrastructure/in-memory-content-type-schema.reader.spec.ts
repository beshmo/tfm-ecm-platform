import { describe, expect, it } from "vitest";

import { InMemoryContentTypeSchemaReader } from "./in-memory-content-type-schema.reader";

describe("in-memory content type schema reader", () => {
  it("GIVEN schemas are added WHEN latest active schema is requested THEN semantic version ordering is used", async () => {
    const reader = new InMemoryContentTypeSchemaReader([
      schema("article", "1.2"),
      schema("article", "1.10"),
      schema("article", "1.0"),
      schema("landing-page", "2.0")
    ]);

    const latest = await reader.findLatestActiveByName("article");

    expect(latest?.version).toBe("1.10");
  });

  it("GIVEN a schema is added after construction WHEN explicit version is requested THEN it is returned", async () => {
    const reader = new InMemoryContentTypeSchemaReader();

    reader.add(schema("article", "2.0"));

    await expect(reader.findByNameAndVersion("article", "2.0")).resolves.toEqual(
      schema("article", "2.0")
    );
  });

  it("GIVEN schemas exist WHEN listed active THEN they are sorted and cloned", async () => {
    const reader = new InMemoryContentTypeSchemaReader([
      schema("landing-page", "1.0"),
      schema("article", "1.0"),
      schema("article", "2.0")
    ]);

    const schemas = await reader.listActive();
    schemas[0]!.fields["title"]!.required = false;

    expect(schemas.map((item) => `${item.name}:${item.version}`)).toEqual([
      "article:2.0",
      "article:1.0",
      "landing-page:1.0"
    ]);
    await expect(reader.findByNameAndVersion("article", "2.0")).resolves.toMatchObject({
      fields: { title: { required: true } }
    });
  });

  it("GIVEN a missing schema WHEN it is requested THEN null is returned", async () => {
    const reader = new InMemoryContentTypeSchemaReader([schema("article", "1.0")]);

    await expect(reader.findLatestActiveByName("landing-page")).resolves.toBeNull();
    await expect(reader.findByNameAndVersion("article", "9.9")).resolves.toBeNull();
  });

  it("GIVEN a returned schema WHEN it is mutated THEN stored state is unchanged", async () => {
    const reader = new InMemoryContentTypeSchemaReader([schema("article", "1.0")]);

    const firstRead = await reader.findByNameAndVersion("article", "1.0");
    firstRead!.fields["title"]!.required = false;

    const secondRead = await reader.findByNameAndVersion("article", "1.0");

    expect(secondRead?.fields["title"]?.required).toBe(true);
  });
});

function schema(name: string, version: string) {
  return {
    name,
    version,
    fields: {
      title: {
        type: "string" as const,
        required: true
      }
    }
  };
}
