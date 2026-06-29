import type { FolderId } from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import {
  applyRenamedAncestorPath,
  buildFolderPath,
  createFolderRecord,
  createRootFolder,
  FolderNameValidationError,
  isRootFolderId,
  normalizeFolderName,
  renameFolderRecord
} from "./folder";

describe("folder domain", () => {
  const now = new Date("2026-06-29T10:00:00.000Z");

  it("GIVEN the root folder WHEN it is created THEN it uses reserved root invariants", () => {
    const root = createRootFolder(now);

    expect(root).toEqual({
      folderId: ROOT_FOLDER_ID,
      name: "Root",
      parentFolderId: null,
      path: "/",
      createdAt: now,
      updatedAt: now
    });
    expect(isRootFolderId(root.folderId)).toBe(true);
  });

  it("GIVEN a parent folder WHEN a child folder is created THEN its FLD id and path are assigned", () => {
    const root = createRootFolder(now);
    const child = createFolderRecord({
      folderId: "FLD-child" as FolderId,
      name: "folder1",
      parent: root,
      now
    });

    expect(child.folderId).toBe("FLD-child");
    expect(child.parentFolderId).toBe(ROOT_FOLDER_ID);
    expect(child.path).toBe("/folder1");
  });

  it("GIVEN a nested parent path WHEN a child path is built THEN the child path extends the parent", () => {
    expect(buildFolderPath("/", "folder1")).toBe("/folder1");
    expect(buildFolderPath("/folder1", "folder2")).toBe("/folder1/folder2");
  });

  it("GIVEN a folder with descendants WHEN renamed THEN descendant paths are recalculated", () => {
    const root = createRootFolder(now);
    const folder = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "folder1",
      parent: root,
      now
    });
    const descendant = createFolderRecord({
      folderId: "FLD-folder2" as FolderId,
      name: "folder2",
      parent: folder,
      now
    });
    const renamed = renameFolderRecord(
      folder,
      "renamed",
      root,
      new Date("2026-06-29T11:00:00.000Z")
    );
    const updatedDescendant = applyRenamedAncestorPath(
      descendant,
      folder.path,
      renamed.path,
      renamed.updatedAt
    );

    expect(renamed.path).toBe("/renamed");
    expect(updatedDescendant.path).toBe("/renamed/folder2");
    expect(updatedDescendant.updatedAt).toEqual(renamed.updatedAt);
  });

  it("GIVEN a valid folder name with surrounding whitespace WHEN normalized THEN it is trimmed", () => {
    expect(normalizeFolderName("  folder1  ")).toBe("folder1");
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["current directory", "."],
    ["parent directory", ".."],
    ["forward slash", "folder/child"],
    ["backslash", "folder\\child"],
    ["control character", "folder\u0001"],
    ["less than", "folder<"],
    ["greater than", "folder>"],
    ["colon", "folder:"],
    ["double quote", 'folder"'],
    ["pipe", "folder|"],
    ["question mark", "folder?"],
    ["asterisk", "folder*"]
  ])("GIVEN an invalid folder name containing %s WHEN normalized THEN it is rejected", (_, name) => {
    expect(() => normalizeFolderName(name)).toThrow(FolderNameValidationError);
  });

  it("GIVEN a non-string folder name WHEN normalized THEN it is rejected", () => {
    expect(() => normalizeFolderName(null)).toThrow(FolderNameValidationError);
  });
});
