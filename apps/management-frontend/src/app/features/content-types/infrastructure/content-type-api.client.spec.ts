import { INITIAL_GENERIC_CONTENT_TYPE_SCHEMA } from "@ecmp/shared-types";
import { of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { ContentTypeApiClient } from "./content-type-api.client";

describe("content type api client", () => {
  it("lists and retrieves schemas through gateway URLs", async () => {
    const http = {
      get: vi
        .fn()
        .mockReturnValueOnce(of([{ name: "generic", version: "1.0", active: true }]))
        .mockReturnValueOnce(of(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA))
        .mockReturnValueOnce(of(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA))
    };
    const client = new ContentTypeApiClient(http as never);

    await expect(client.listSchemas()).resolves.toEqual([
      { name: "generic", version: "1.0", active: true }
    ]);
    await expect(client.getLatestSchema("generic")).resolves.toEqual(
      INITIAL_GENERIC_CONTENT_TYPE_SCHEMA
    );
    await expect(client.getSchemaVersion("generic", "1.0")).resolves.toEqual(
      INITIAL_GENERIC_CONTENT_TYPE_SCHEMA
    );

    expect(http.get).toHaveBeenNthCalledWith(1, "/api/management/content-types");
    expect(http.get).toHaveBeenNthCalledWith(2, "/api/management/content-types/generic");
    expect(http.get).toHaveBeenNthCalledWith(
      3,
      "/api/management/content-types/generic/versions/1.0"
    );
  });
});
