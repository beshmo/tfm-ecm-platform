import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpContentTypeSchemaReader } from "./http-content-type-schema.reader";

const BASE_URL = "http://content-type-service.test";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function schema(name: string, version: string) {
  return {
    name,
    version,
    fields: { title: { type: "string" as const, required: true } }
  };
}

describe("http content type schema reader", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GIVEN the schema exists WHEN latest active schema is requested THEN it fetches the by-name endpoint", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, schema("article", "1.0")));
    vi.stubGlobal("fetch", fetchMock);
    const reader = new HttpContentTypeSchemaReader(BASE_URL);

    const result = await reader.findLatestActiveByName("article");

    expect(result).toEqual(schema("article", "1.0"));
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/management/content-types/article`);
  });

  it("GIVEN the schema does not exist WHEN latest active schema is requested THEN null is returned", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(404, { message: "not found" })));
    const reader = new HttpContentTypeSchemaReader(BASE_URL);

    await expect(reader.findLatestActiveByName("missing")).resolves.toBeNull();
  });

  it("GIVEN a version WHEN a specific schema version is requested THEN it fetches the versions endpoint", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, schema("article", "2.0")));
    vi.stubGlobal("fetch", fetchMock);
    const reader = new HttpContentTypeSchemaReader(BASE_URL);

    const result = await reader.findByNameAndVersion("article", "2.0");

    expect(result).toEqual(schema("article", "2.0"));
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/management/content-types/article/versions/2.0`
    );
  });

  it("GIVEN a version does not exist WHEN it is requested THEN null is returned", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(404, { message: "not found" })));
    const reader = new HttpContentTypeSchemaReader(BASE_URL);

    await expect(reader.findByNameAndVersion("article", "9.9")).resolves.toBeNull();
  });

  it("GIVEN the content type service errors WHEN a schema is requested THEN the error propagates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(500, { message: "boom" })));
    const reader = new HttpContentTypeSchemaReader(BASE_URL);

    await expect(reader.findLatestActiveByName("article")).rejects.toThrow(
      "Content type service request failed with status 500."
    );
  });

  it("GIVEN active schemas exist WHEN listActive is called THEN only active summaries are resolved to full definitions", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url.endsWith("/api/management/content-types")) {
        return jsonResponse(200, [
          { name: "article", version: "1.0", active: true },
          { name: "generic", version: "1.0", active: false }
        ]);
      }

      return jsonResponse(200, schema("article", "1.0"));
    });
    vi.stubGlobal("fetch", fetchMock);
    const reader = new HttpContentTypeSchemaReader(BASE_URL);

    const result = await reader.listActive();

    expect(result).toEqual([schema("article", "1.0")]);
  });
});
