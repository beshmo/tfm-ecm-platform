import { describe, expect, it } from "vitest";

import {
  compareContentTypeVersions,
  contentTypeSchemaKey,
  createContentTypeSchemaRecord,
  deactivateContentTypeSchemaRecord,
  toContentTypeSchemaSummary
} from "./content-type-schema";

describe("content type schema domain", () => {
  const definition = {
    name: "generic",
    version: "1.0",
    fields: [{ name: "title", type: "string" as const, required: true }]
  };

  it("GIVEN a normalized definition WHEN a schema record is created THEN it is active", () => {
    const createdAt = new Date("2026-06-01T10:00:00.000Z");

    const record = createContentTypeSchemaRecord(definition, createdAt);

    expect(record.active).toBe(true);
    expect(record.createdAt).toBe(createdAt);
    expect(record.updatedAt).toBe(createdAt);
    expect(record.definition).toEqual(definition);
  });

  it("GIVEN an active schema record WHEN it is deactivated THEN history is preserved", () => {
    const record = createContentTypeSchemaRecord(definition);
    const deactivatedAt = new Date("2026-06-01T11:00:00.000Z");

    const deactivated = deactivateContentTypeSchemaRecord(record, deactivatedAt);

    expect(deactivated.active).toBe(false);
    expect(deactivated.deactivatedAt).toBe(deactivatedAt);
    expect(deactivated.updatedAt).toBe(deactivatedAt);
    expect(deactivated.definition).toEqual(definition);
  });

  it("GIVEN schema versions WHEN they are compared THEN numeric segments determine ordering", () => {
    expect(compareContentTypeVersions("1.10", "1.2")).toBeGreaterThan(0);
    expect(compareContentTypeVersions("1.0", "1.0.0")).toBe(0);
  });

  it("GIVEN a schema record WHEN it is summarized THEN only public summary fields are returned", () => {
    const record = createContentTypeSchemaRecord(definition);

    expect(toContentTypeSchemaSummary(record)).toEqual({
      name: "generic",
      version: "1.0",
      active: true
    });
  });

  it("GIVEN a schema identity WHEN a repository key is created THEN name and version identify the record", () => {
    expect(contentTypeSchemaKey("generic", "1.0")).toBe("generic:1.0");
  });
});
