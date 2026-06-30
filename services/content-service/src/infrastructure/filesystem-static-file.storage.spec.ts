import { mkdir, mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { StaticFileId } from "@ecmp/shared-types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FilesystemStaticFileStorage } from "./filesystem-static-file.storage";

describe("filesystem static file storage", () => {
  let rootPath: string;

  beforeEach(async () => {
    rootPath = await mkdtemp(path.join(os.tmpdir(), "ecmp-static-files-"));
  });

  afterEach(async () => {
    await rm(rootPath, { recursive: true, force: true });
  });

  it("GIVEN a valid upload WHEN saved THEN it writes the binary to a generated final path", async () => {
    const storage = new FilesystemStaticFileStorage(rootPath);

    const stored = await storage.save({
      fileId: "STF-file1" as StaticFileId,
      filename: "manual.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("content")
    });

    expect(stored).toEqual({ path: "STF-file1.pdf" });
    await expect(readFile(path.join(rootPath, stored.path), "utf8")).resolves.toBe("content");
    expect(stored.path).not.toContain("manual.pdf");
    expect(stored.path).not.toContain(".tmp");
  });

  it("GIVEN a stored path under the root WHEN deleted THEN it removes the binary", async () => {
    const storage = new FilesystemStaticFileStorage(rootPath);
    const stored = await storage.save({
      fileId: "STF-file1" as StaticFileId,
      filename: "manual.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("content")
    });

    await storage.delete(stored.path);

    await expect(stat(path.join(rootPath, stored.path))).rejects.toThrow();
  });

  it("GIVEN a traversal path WHEN deleted THEN it rejects access outside the root", async () => {
    const storage = new FilesystemStaticFileStorage(rootPath);

    await expect(storage.delete("../outside.pdf")).rejects.toThrow(
      "Static file path is outside the storage root."
    );
  });

  it("GIVEN final path publication fails WHEN saved THEN it rejects without replacing that path", async () => {
    const storage = new FilesystemStaticFileStorage(rootPath);
    const finalPath = path.join(rootPath, "STF-file1.pdf");
    await rm(finalPath, { recursive: true, force: true });
    await mkdir(finalPath);

    await expect(
      storage.save({
        fileId: "STF-file1" as StaticFileId,
        filename: "manual.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("content")
      })
    ).rejects.toThrow();

    await expect(readFile(path.join(rootPath, "STF-file1.pdf"))).rejects.toThrow();
  });

  it("GIVEN final path publication fails WHEN saved THEN it cleans up temporary upload files", async () => {
    const storage = new FilesystemStaticFileStorage(rootPath);
    const finalPath = path.join(rootPath, "STF-file1.pdf");
    await rm(finalPath, { recursive: true, force: true });
    await mkdir(finalPath);

    await expect(
      storage.save({
        fileId: "STF-file1" as StaticFileId,
        filename: "manual.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("content")
      })
    ).rejects.toThrow();

    await expect(readdir(path.join(rootPath, ".tmp"))).resolves.toEqual([]);
  });
});
