import { HttpErrorResponse } from "@angular/common/http";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { of, throwError } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { StaticFileApiClient } from "./static-file-api.client";

describe("document api client", () => {
  it("lists files by folder through the gateway URL", async () => {
    const http = {
      get: vi.fn().mockReturnValue(of([{ fileId: "STF-1" }]))
    };
    const client = new StaticFileApiClient(http as never);

    await expect(client.listFiles(ROOT_FOLDER_ID)).resolves.toEqual([{ fileId: "STF-1" }]);
    expect(http.get).toHaveBeenCalledWith("/api/management/files?folderId=FLD-root");
  });

  it("encodes dynamic document management URLs", async () => {
    const http = {
      get: vi.fn().mockReturnValue(of([])),
      patch: vi.fn().mockReturnValue(of({ fileId: "STF-a/b", filename: "renamed.pdf" })),
      delete: vi.fn().mockReturnValue(of(undefined))
    };
    const client = new StaticFileApiClient(http as never);

    await client.listFiles("FLD-a/b" as never);
    await client.renameFile("STF-a/b" as never, { filename: "renamed.pdf" });
    await client.deleteFile("STF-a/b" as never);

    expect(http.get).toHaveBeenCalledWith("/api/management/files?folderId=FLD-a%2Fb");
    expect(http.patch).toHaveBeenCalledWith("/api/management/files/STF-a%2Fb", {
      filename: "renamed.pdf"
    });
    expect(http.delete).toHaveBeenCalledWith("/api/management/files/STF-a%2Fb");
  });

  it("uploads, renames, and deletes files through gateway URLs", async () => {
    const http = {
      post: vi.fn().mockReturnValue(of({ fileId: "STF-1" })),
      patch: vi.fn().mockReturnValue(of({ fileId: "STF-1", filename: "renamed.pdf" })),
      delete: vi.fn().mockReturnValue(of(undefined))
    };
    const client = new StaticFileApiClient(http as never);
    const file = new File(["content"], "manual.pdf", { type: "application/pdf" });

    await client.uploadFile(ROOT_FOLDER_ID, file);
    await client.renameFile("STF-1", { filename: "renamed.pdf" });
    await client.deleteFile("STF-1");

    const formData = http.post.mock.calls[0]?.[1] as FormData;

    expect(http.post).toHaveBeenCalledWith("/api/management/files", expect.any(FormData));
    expect(http.post.mock.calls[0]?.[2]).toBeUndefined();
    expect(formData.get("folderId")).toBe(ROOT_FOLDER_ID);
    expect(formData.get("file")).toBe(file);
    expect(http.patch).toHaveBeenCalledWith("/api/management/files/STF-1", {
      filename: "renamed.pdf"
    });
    expect(http.delete).toHaveBeenCalledWith("/api/management/files/STF-1");
  });

  it("maps upload errors from Angular HTTP failures", async () => {
    const http = {
      post: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 415,
              error: { message: "Document MIME type is not supported." }
            })
        )
      )
    };
    const client = new StaticFileApiClient(http as never);

    await expect(
      client.uploadFile(ROOT_FOLDER_ID, new File(["content"], "app.exe"))
    ).rejects.toMatchObject({
      status: 415,
      message: "Document MIME type is not supported."
    });
  });

  it("maps oversized upload and delete failures from Angular HTTP failures", async () => {
    const http = {
      post: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 413,
              error: { message: "Document is too large." }
            })
        )
      ),
      delete: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              error: { message: "Document storage failed." }
            })
        )
      )
    };
    const client = new StaticFileApiClient(http as never);

    await expect(
      client.uploadFile(ROOT_FOLDER_ID, new File(["content"], "large.pdf"))
    ).rejects.toMatchObject({
      status: 413,
      message: "Document is too large."
    });
    await expect(client.deleteFile("STF-1")).rejects.toMatchObject({
      status: 500,
      message: "Document storage failed."
    });
  });
});
