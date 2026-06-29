import type { FolderId } from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import {
  applyRenamedAncestorPath,
  createFolderRecord,
  createRootFolder,
  renameFolderRecord
} from "../domain/folder";
import {
  CryptoFolderIdGenerator,
  EmptyFolderContentReader,
  InMemoryFolderRepository
} from "./in-memory-folder.repository";

describe("in-memory folder repository", () => {
  const now = new Date("2026-06-29T10:00:00.000Z");

  it("GIVEN no seed folders WHEN constructed THEN it seeds the reserved root folder", async () => {
    const repository = new InMemoryFolderRepository();

    const root = await repository.findById(ROOT_FOLDER_ID);

    expect(root?.folderId).toBe(ROOT_FOLDER_ID);
    expect(root?.parentFolderId).toBeNull();
    expect(root?.path).toBe("/");
  });

  it("GIVEN a saved folder WHEN retrieved and mutated THEN stored data is not mutated", async () => {
    const root = createRootFolder(now);
    const repository = new InMemoryFolderRepository([root]);
    const folder = await repository.save(
      createFolderRecord({
        folderId: "FLD-folder1" as FolderId,
        name: "folder1",
        parent: root,
        now
      })
    );

    folder.name = "mutated";
    folder.createdAt.setUTCFullYear(2000);

    const storedFolder = await repository.findById("FLD-folder1" as FolderId);

    expect(storedFolder?.name).toBe("folder1");
    expect(storedFolder?.createdAt).toEqual(now);
  });

  it("GIVEN folders exist WHEN listed THEN all folders or direct children can be returned", async () => {
    const root = createRootFolder(now);
    const folder1 = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "folder1",
      parent: root,
      now
    });
    const folder2 = createFolderRecord({
      folderId: "FLD-folder2" as FolderId,
      name: "folder2",
      parent: folder1,
      now
    });
    const repository = new InMemoryFolderRepository([root, folder1, folder2]);

    await expect(repository.list()).resolves.toHaveLength(3);
    await expect(repository.listByParentFolderId(ROOT_FOLDER_ID)).resolves.toEqual([folder1]);
  });

  it("GIVEN sibling folders WHEN looked up by name THEN matching is case-insensitive", async () => {
    const root = createRootFolder(now);
    const folder = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "Folder1",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, folder]);

    const sibling = await repository.findByParentFolderIdAndName(ROOT_FOLDER_ID, "folder1");
    const excluded = await repository.findByParentFolderIdAndName(
      ROOT_FOLDER_ID,
      "folder1",
      folder.folderId
    );

    expect(sibling?.folderId).toBe(folder.folderId);
    expect(excluded).toBeNull();
  });

  it("GIVEN descendant paths are replaced WHEN folders are stored THEN updated paths are persisted", async () => {
    const root = createRootFolder(now);
    const folder = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "folder1",
      parent: root,
      now
    });
    const child = createFolderRecord({
      folderId: "FLD-folder2" as FolderId,
      name: "folder2",
      parent: folder,
      now
    });
    const repository = new InMemoryFolderRepository([root, folder, child]);
    const renamed = renameFolderRecord(folder, "renamed", root, now);
    const updatedChild = applyRenamedAncestorPath(child, folder.path, renamed.path, now);

    await repository.replaceMany([renamed, updatedChild]);

    await expect(repository.findById(folder.folderId)).resolves.toMatchObject({
      path: "/renamed"
    });
    await expect(repository.findById(child.folderId)).resolves.toMatchObject({
      path: "/renamed/folder2"
    });
  });

  it("GIVEN a folder exists WHEN deleted THEN it can no longer be retrieved", async () => {
    const root = createRootFolder(now);
    const folder = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "folder1",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, folder]);

    await repository.delete(folder.folderId);

    await expect(repository.findById(folder.folderId)).resolves.toBeNull();
  });
});

describe("folder infrastructure helpers", () => {
  it("GIVEN crypto folder ID generation WHEN next is called THEN an FLD id is returned", () => {
    const generator = new CryptoFolderIdGenerator();

    expect(generator.next()).toMatch(/^FLD-/);
  });

  it("GIVEN empty content reader WHEN checked THEN it reports no assigned content", async () => {
    const reader = new EmptyFolderContentReader();

    await expect(reader.hasAssignedContent("FLD-folder1" as FolderId)).resolves.toBe(false);
  });
});
