import { HttpErrorResponse } from "@angular/common/http";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { of, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { ContentApiClient } from "./content-api.client";

describe("content api client", () => {
  it("lists content records by folder through the gateway URL", async () => {
    const http = {
      get: vi.fn().mockReturnValue(of([{ contentId: "RCD-1" }]))
    };
    const client = new ContentApiClient(http as never);

    await expect(client.listContents(ROOT_FOLDER_ID)).resolves.toEqual([{ contentId: "RCD-1" }]);
    expect(http.get).toHaveBeenCalledWith("/api/management/contents?folderId=FLD-root");
  });

  it("encodes dynamic content management URLs", async () => {
    const http = {
      get: vi.fn().mockReturnValue(of([])),
      put: vi.fn().mockReturnValue(of({ contentId: "RCD-a/b" })),
      delete: vi.fn().mockReturnValue(of(undefined))
    };
    const client = new ContentApiClient(http as never);

    await client.listContents("FLD-a/b" as never);
    await client.replaceContent("RCD-a/b" as never, {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: {}
    });
    await client.deleteContent("RCD-a/b" as never);

    expect(http.get).toHaveBeenCalledWith("/api/management/contents?folderId=FLD-a%2Fb");
    expect(http.put).toHaveBeenCalledWith("/api/management/contents/RCD-a%2Fb", {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: {}
    });
    expect(http.delete).toHaveBeenCalledWith("/api/management/contents/RCD-a%2Fb");
  });

  it("creates, replaces, and deletes content through gateway URLs", async () => {
    const http = {
      post: vi.fn().mockReturnValue(of({ contentId: "RCD-1" })),
      put: vi.fn().mockReturnValue(of({ contentId: "RCD-1", version: 2 })),
      delete: vi.fn().mockReturnValue(of(undefined))
    };
    const client = new ContentApiClient(http as never);

    await client.createContent({
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      data: { title: "Welcome" }
    });
    await client.replaceContent("RCD-1", {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: { title: "Updated" }
    });
    await client.deleteContent("RCD-1");

    expect(http.post).toHaveBeenCalledWith("/api/management/contents", {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      data: { title: "Welcome" }
    });
    expect(http.put).toHaveBeenCalledWith("/api/management/contents/RCD-1", {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: { title: "Updated" }
    });
    expect(http.delete).toHaveBeenCalledWith("/api/management/contents/RCD-1");
  });

  it("maps validation errors from Angular HTTP failures", async () => {
    const http = {
      post: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              error: {
                message: "Content data is invalid.",
                errors: [{ message: "title must be a string." }]
              }
            })
        )
      )
    };
    const client = new ContentApiClient(http as never);

    await expect(
      client.createContent({
        folderId: ROOT_FOLDER_ID,
        contentType: "generic",
        data: { title: 1 }
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "Content data is invalid.",
      validationMessages: ["title must be a string."]
    });
  });

  it("maps not-found and conflict errors from Angular HTTP failures", async () => {
    const http = {
      put: vi
        .fn()
        .mockReturnValueOnce(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 404,
                error: { message: "Content record was not found." }
              })
          )
        )
        .mockReturnValueOnce(
          throwError(
            () =>
              new HttpErrorResponse({
                status: 409,
                error: { message: "Content type cannot be changed." }
              })
          )
        )
    };
    const client = new ContentApiClient(http as never);
    const input = {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: {}
    };

    await expect(client.replaceContent("RCD-missing", input)).rejects.toMatchObject({
      status: 404,
      message: "Content record was not found.",
      validationMessages: []
    });
    await expect(client.replaceContent("RCD-conflict", input)).rejects.toMatchObject({
      status: 409,
      message: "Content type cannot be changed.",
      validationMessages: []
    });
  });
});
