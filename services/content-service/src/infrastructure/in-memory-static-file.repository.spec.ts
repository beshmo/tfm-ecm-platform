import type { FolderId, StaticFileId } from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import type { StaticFileEntity } from "../domain/static-file";
import {
  CryptoStaticFileIdGenerator,
  InMemoryStaticFileRepository
} from "./in-memory-static-file.repository";

describe("in-memory document repository", () => {
  const now = new Date("2026-06-30T10:00:00.000Z");
  const later = new Date("2026-06-30T11:00:00.000Z");

  it("GIVEN files exist WHEN listed by folder THEN files are sorted by createdAt then fileId", async () => {
    const repository = new InMemoryStaticFileRepository([
      file("STF-b" as StaticFileId, ROOT_FOLDER_ID, now),
      file("STF-c" as StaticFileId, ROOT_FOLDER_ID, later),
      file("STF-a" as StaticFileId, ROOT_FOLDER_ID, now)
    ]);

    const files = await repository.listByFolderId(ROOT_FOLDER_ID);

    expect(files.map((item) => item.fileId)).toEqual(["STF-a", "STF-b", "STF-c"]);
  });

  it("GIVEN files exist in folders WHEN listed THEN only matching folder files are returned", async () => {
    const folderId = "FLD-child" as FolderId;
    const repository = new InMemoryStaticFileRepository([
      file("STF-root" as StaticFileId, ROOT_FOLDER_ID, now),
      file("STF-child" as StaticFileId, folderId, now)
    ]);

    const files = await repository.listByFolderId(folderId);

    expect(files.map((item) => item.fileId)).toEqual(["STF-child"]);
  });

  it("GIVEN a stored file WHEN returned and mutated THEN stored metadata is not changed", async () => {
    const repository = new InMemoryStaticFileRepository([
      file("STF-file1" as StaticFileId, ROOT_FOLDER_ID, now)
    ]);
    const stored = await repository.findById("STF-file1" as StaticFileId);

    if (!stored) {
      throw new Error("Expected file to exist.");
    }

    stored.filename = "mutated.pdf";
    stored.createdAt.setUTCFullYear(2000);

    await expect(repository.findById("STF-file1" as StaticFileId)).resolves.toMatchObject({
      filename: "manual.pdf",
      createdAt: now
    });
  });

  it("GIVEN files are assigned to folders WHEN occupancy is checked THEN assigned files are reported", async () => {
    const repository = new InMemoryStaticFileRepository([
      file("STF-file1" as StaticFileId, ROOT_FOLDER_ID, now)
    ]);

    await expect(repository.hasAssignedFiles(ROOT_FOLDER_ID)).resolves.toBe(true);
    await expect(repository.hasAssignedFiles("FLD-empty" as FolderId)).resolves.toBe(false);
  });

  it("GIVEN a file exists WHEN replaced or deleted THEN repository state is updated", async () => {
    const repository = new InMemoryStaticFileRepository([
      file("STF-file1" as StaticFileId, ROOT_FOLDER_ID, now)
    ]);

    await repository.replace({
      ...file("STF-file1" as StaticFileId, ROOT_FOLDER_ID, now),
      filename: "updated.pdf",
      updatedAt: later
    });

    await expect(repository.findById("STF-file1" as StaticFileId)).resolves.toMatchObject({
      filename: "updated.pdf",
      updatedAt: later
    });

    await repository.delete("STF-file1" as StaticFileId);

    await expect(repository.findById("STF-file1" as StaticFileId)).resolves.toBeNull();
  });
});

describe("document infrastructure helpers", () => {
  it("GIVEN crypto document ID generation WHEN next is called THEN an STF id is returned", () => {
    const generator = new CryptoStaticFileIdGenerator();

    expect(generator.next()).toMatch(/^STF-/);
  });
});

function file(fileId: StaticFileId, folderId: FolderId, createdAt: Date): StaticFileEntity {
  return {
    fileId,
    folderId,
    filename: "manual.pdf",
    mimeType: "application/pdf",
    size: 7,
    path: `stored/${fileId}`,
    createdAt,
    updatedAt: createdAt
  };
}
