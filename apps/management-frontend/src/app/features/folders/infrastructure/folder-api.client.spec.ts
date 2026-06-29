import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { FolderApiClient } from "./folder-api.client";

describe("folder api client", () => {
  it("lists and retrieves folders through gateway URLs", async () => {
    const http = {
      get: vi
        .fn()
        .mockReturnValueOnce(of([{ folderId: ROOT_FOLDER_ID }]))
        .mockReturnValueOnce(of({ folderId: ROOT_FOLDER_ID }))
    };
    const client = new FolderApiClient(http as never);

    await expect(client.listFolders()).resolves.toEqual([{ folderId: ROOT_FOLDER_ID }]);
    await expect(client.getFolder(ROOT_FOLDER_ID)).resolves.toEqual({ folderId: ROOT_FOLDER_ID });

    expect(http.get).toHaveBeenNthCalledWith(1, "/api/management/folders");
    expect(http.get).toHaveBeenNthCalledWith(2, "/api/management/folders/FLD-root");
  });
});
