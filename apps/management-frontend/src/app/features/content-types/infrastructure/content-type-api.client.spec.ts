import { HttpErrorResponse } from "@angular/common/http";
import { INITIAL_GENERIC_CONTENT_TYPE_SCHEMA } from "@ecmp/shared-types";
import { of, throwError } from "rxjs";
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

  it("encodes content type and schema version URL segments", async () => {
    const http = {
      get: vi
        .fn()
        .mockReturnValueOnce(of(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA))
        .mockReturnValueOnce(of(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA))
    };
    const client = new ContentTypeApiClient(http as never);

    await client.getLatestSchema("article/news" as never);
    await client.getSchemaVersion("article/news" as never, "1.0/beta" as never);

    expect(http.get).toHaveBeenNthCalledWith(1, "/api/management/content-types/article%2Fnews");
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      "/api/management/content-types/article%2Fnews/versions/1.0%2Fbeta"
    );
  });

  it("maps schema request errors from Angular HTTP failures", async () => {
    const http = {
      get: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 404,
              error: { message: "Content type schema was not found." }
            })
        )
      )
    };
    const client = new ContentTypeApiClient(http as never);

    await expect(client.getLatestSchema("missing" as never)).rejects.toMatchObject({
      status: 404,
      message: "Content type schema was not found.",
      validationMessages: []
    });
  });

  it("creates, replaces, and deactivates schemas through gateway URLs", async () => {
    const http = {
      post: vi.fn().mockReturnValue(of(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA)),
      put: vi.fn().mockReturnValue(of(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA)),
      delete: vi.fn().mockReturnValue(of(undefined))
    };
    const client = new ContentTypeApiClient(http as never);

    await expect(client.createSchema("name: generic")).resolves.toEqual(
      INITIAL_GENERIC_CONTENT_TYPE_SCHEMA
    );
    await expect(
      client.replaceSchemaVersion("article/news" as never, "1.0/beta" as never, "name: article")
    ).resolves.toEqual(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA);
    await expect(
      client.deactivateSchemaVersion("article/news" as never, "1.0/beta" as never)
    ).resolves.toBeUndefined();

    expect(http.post).toHaveBeenCalledWith("/api/management/content-types", {
      schemaSource: "name: generic"
    });
    expect(http.put).toHaveBeenCalledWith(
      "/api/management/content-types/article%2Fnews/versions/1.0%2Fbeta",
      { schemaSource: "name: article" }
    );
    expect(http.delete).toHaveBeenCalledWith(
      "/api/management/content-types/article%2Fnews/versions/1.0%2Fbeta"
    );
  });

  it("maps schema write validation errors from Angular HTTP failures", async () => {
    const http = {
      post: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: {
                message: "Content type schema is invalid.",
                errors: [
                  { message: "Schema source must be valid YAML." },
                  { message: "Schema must define 'name'." }
                ]
              }
            })
        )
      )
    };
    const client = new ContentTypeApiClient(http as never);

    await expect(client.createSchema("name: [")).rejects.toMatchObject({
      status: 400,
      message: "Content type schema is invalid.",
      validationMessages: [
        "Schema source must be valid YAML.",
        "Schema must define 'name'."
      ]
    });
  });

  it("loads schema folder context and folder-scoped definitions through gateway URLs", async () => {
    const folder = {
      folderId: "FLD-system-schemas",
      name: "schemas",
      parentFolderId: "FLD-system",
      path: "/system/schemas",
      createdAt: "2026-06-29T10:00:00.000Z",
      updatedAt: "2026-06-29T10:00:00.000Z"
    };
    const http = {
      get: vi
        .fn()
        .mockReturnValueOnce(of(folder))
        .mockReturnValueOnce(of([folder]))
        .mockReturnValueOnce(of([{ name: "generic", folderId: "FLD-system-schemas" }]))
    };
    const client = new ContentTypeApiClient(http as never);

    await expect(client.getSchemaFolder("FLD-system-schemas" as never)).resolves.toEqual(folder);
    await expect(client.listSchemaSubfolders("FLD-system-schemas" as never)).resolves.toEqual([
      folder
    ]);
    await client.listContentTypeDefinitions("FLD-system-schemas" as never);

    expect(http.get).toHaveBeenNthCalledWith(1, "/api/management/folders/FLD-system-schemas");
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      "/api/management/folders?parentFolderId=FLD-system-schemas"
    );
    expect(http.get).toHaveBeenNthCalledWith(
      3,
      "/api/management/content-types/definitions?folderId=FLD-system-schemas"
    );
  });

  it("creates schema folders, schemas with a folder, and moves definitions through gateway URLs", async () => {
    const http = {
      post: vi
        .fn()
        .mockReturnValueOnce(of({ folderId: "FLD-news" }))
        .mockReturnValueOnce(of(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA))
        .mockReturnValueOnce(of({ name: "generic", folderId: "FLD-news" }))
    };
    const client = new ContentTypeApiClient(http as never);

    await client.createSchemaFolder("news", "FLD-system-schemas" as never);
    await client.createSchema("name: generic", "FLD-system-schemas" as never);
    await client.moveContentTypeDefinition("generic" as never, "FLD-news" as never);

    expect(http.post).toHaveBeenNthCalledWith(1, "/api/management/folders", {
      name: "news",
      parentFolderId: "FLD-system-schemas"
    });
    expect(http.post).toHaveBeenNthCalledWith(2, "/api/management/content-types", {
      schemaSource: "name: generic",
      folderId: "FLD-system-schemas"
    });
    expect(http.post).toHaveBeenNthCalledWith(
      3,
      "/api/management/content-types/generic/move",
      { targetFolderId: "FLD-news" }
    );
  });

  it("maps representative schema write conflict and oversized errors", async () => {
    const http = {
      put: vi.fn().mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { message: "Content type schema name or version does not match." }
            })
        )
      ),
      delete: vi.fn().mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 413,
              error: { message: "Content type schema source exceeds the maximum allowed size." }
            })
        )
      )
    };
    const client = new ContentTypeApiClient(http as never);

    await expect(
      client.replaceSchemaVersion("generic", "1.0", "name: article")
    ).rejects.toMatchObject({
      status: 409,
      message: "Content type schema name or version does not match.",
      validationMessages: []
    });
    await expect(client.deactivateSchemaVersion("generic", "1.0")).rejects.toMatchObject({
      status: 413,
      message: "Content type schema source exceeds the maximum allowed size.",
      validationMessages: []
    });
  });
});
