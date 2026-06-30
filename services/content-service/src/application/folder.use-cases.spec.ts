import type { FolderId } from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it } from "vitest";

import type { FolderContentReader } from "../domain/folder-content.reader";
import type { FolderIdGenerator } from "../domain/folder-id-generator";
import { createFolderRecord, createRootFolder } from "../domain/folder";
import { CompositeFolderContentReader } from "../infrastructure/composite-folder-content.reader";
import { InMemoryFolderRepository } from "../infrastructure/in-memory-folder.repository";
import { InMemoryStaticFileRepository } from "../infrastructure/in-memory-static-file.repository";
import {
  DuplicateFolderNameError,
  FolderNotEmptyError,
  FolderNotFoundError,
  InvalidFolderNameError,
  ParentFolderNotFoundError,
  RootFolderOperationNotAllowedError
} from "./folder.errors";
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  GetFolderUseCase,
  ListFoldersUseCase,
  RenameFolderUseCase
} from "./folder.use-cases";

describe("folder use cases", () => {
  const now = new Date("2026-06-29T10:00:00.000Z");
  const later = new Date("2026-06-29T11:00:00.000Z");

  it("GIVEN folders exist WHEN all folders are listed THEN they are returned sorted by path", async () => {
    const root = createRootFolder(now);
    const zeta = createFolderRecord({
      folderId: "FLD-zeta" as FolderId,
      name: "zeta",
      parent: root,
      now
    });
    const alpha = createFolderRecord({
      folderId: "FLD-alpha" as FolderId,
      name: "alpha",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, zeta, alpha]);

    const folders = await new ListFoldersUseCase(repository).execute();

    expect(folders.map((folder) => folder.path)).toEqual(["/", "/alpha", "/zeta"]);
  });

  it("GIVEN folders exist WHEN direct children are listed THEN only that parent's children are returned by name", async () => {
    const root = createRootFolder(now);
    const parent = createFolderRecord({
      folderId: "FLD-parent" as FolderId,
      name: "parent",
      parent: root,
      now
    });
    const beta = createFolderRecord({
      folderId: "FLD-beta" as FolderId,
      name: "beta",
      parent,
      now
    });
    const alpha = createFolderRecord({
      folderId: "FLD-alpha" as FolderId,
      name: "alpha",
      parent,
      now
    });
    const repository = new InMemoryFolderRepository([root, parent, beta, alpha]);

    const folders = await new ListFoldersUseCase(repository).execute(parent.folderId);

    expect(folders.map((folder) => folder.name)).toEqual(["alpha", "beta"]);
  });

  it("GIVEN a folder exists WHEN it is retrieved THEN it is returned", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);

    const folder = await new GetFolderUseCase(repository).execute(ROOT_FOLDER_ID);

    expect(folder.path).toBe("/");
  });

  it("GIVEN a folder is missing WHEN it is retrieved THEN a folder not found error is thrown", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);

    await expect(
      new GetFolderUseCase(repository).execute("FLD-missing" as FolderId)
    ).rejects.toBeInstanceOf(FolderNotFoundError);
  });

  it("GIVEN the root folder WHEN a root child is created THEN the folder is saved with a generated id", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);
    const useCase = new CreateFolderUseCase(
      repository,
      new StaticFolderIdGenerator("FLD-folder1" as FolderId),
      () => now
    );

    const folder = await useCase.execute({
      name: " folder1 ",
      parentFolderId: ROOT_FOLDER_ID
    });

    expect(folder).toMatchObject({
      folderId: "FLD-folder1",
      name: "folder1",
      parentFolderId: ROOT_FOLDER_ID,
      path: "/folder1"
    });
  });

  it("GIVEN a parent folder WHEN a nested child is created THEN the child path extends parent path", async () => {
    const root = createRootFolder(now);
    const parent = createFolderRecord({
      folderId: "FLD-parent" as FolderId,
      name: "parent",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, parent]);
    const useCase = new CreateFolderUseCase(
      repository,
      new StaticFolderIdGenerator("FLD-child" as FolderId),
      () => now
    );

    const folder = await useCase.execute({
      name: "child",
      parentFolderId: parent.folderId
    });

    expect(folder.path).toBe("/parent/child");
  });

  it("GIVEN a missing parent WHEN a folder is created THEN a parent not found error is thrown", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);
    const useCase = new CreateFolderUseCase(
      repository,
      new StaticFolderIdGenerator("FLD-folder1" as FolderId)
    );

    await expect(
      useCase.execute({
        name: "folder1",
        parentFolderId: "FLD-missing" as FolderId
      })
    ).rejects.toBeInstanceOf(ParentFolderNotFoundError);
  });

  it("GIVEN invalid input WHEN a folder is created THEN an invalid folder name error is thrown", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);
    const useCase = new CreateFolderUseCase(
      repository,
      new StaticFolderIdGenerator("FLD-folder1" as FolderId)
    );

    await expect(
      useCase.execute({
        name: "bad/name",
        parentFolderId: ROOT_FOLDER_ID
      })
    ).rejects.toBeInstanceOf(InvalidFolderNameError);
  });

  it("GIVEN a duplicate sibling exists WHEN a folder is created THEN a duplicate error is thrown", async () => {
    const root = createRootFolder(now);
    const existing = createFolderRecord({
      folderId: "FLD-existing" as FolderId,
      name: "Folder1",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, existing]);
    const useCase = new CreateFolderUseCase(
      repository,
      new StaticFolderIdGenerator("FLD-folder1" as FolderId)
    );

    await expect(
      useCase.execute({
        name: "folder1",
        parentFolderId: ROOT_FOLDER_ID
      })
    ).rejects.toBeInstanceOf(DuplicateFolderNameError);
  });

  it("GIVEN a folder with descendants WHEN renamed THEN descendant paths are updated", async () => {
    const root = createRootFolder(now);
    const parent = createFolderRecord({
      folderId: "FLD-parent" as FolderId,
      name: "parent",
      parent: root,
      now
    });
    const child = createFolderRecord({
      folderId: "FLD-child" as FolderId,
      name: "child",
      parent,
      now
    });
    const repository = new InMemoryFolderRepository([root, parent, child]);

    const renamed = await new RenameFolderUseCase(repository, () => later).execute(
      parent.folderId,
      { name: "renamed" }
    );
    const updatedChild = await repository.findById(child.folderId);

    expect(renamed.path).toBe("/renamed");
    expect(renamed.updatedAt).toEqual(later);
    expect(updatedChild?.path).toBe("/renamed/child");
  });

  it("GIVEN root folder WHEN renamed THEN a root operation conflict is thrown", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);

    await expect(
      new RenameFolderUseCase(repository).execute(ROOT_FOLDER_ID, { name: "new-root" })
    ).rejects.toBeInstanceOf(RootFolderOperationNotAllowedError);
  });

  it("GIVEN a duplicate sibling exists WHEN renamed THEN a duplicate error is thrown", async () => {
    const root = createRootFolder(now);
    const left = createFolderRecord({
      folderId: "FLD-left" as FolderId,
      name: "left",
      parent: root,
      now
    });
    const right = createFolderRecord({
      folderId: "FLD-right" as FolderId,
      name: "right",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, left, right]);

    await expect(
      new RenameFolderUseCase(repository).execute(right.folderId, { name: "LEFT" })
    ).rejects.toBeInstanceOf(DuplicateFolderNameError);
  });

  it("GIVEN an empty user folder WHEN deleted THEN it is removed", async () => {
    const root = createRootFolder(now);
    const folder = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "folder1",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, folder]);

    await new DeleteFolderUseCase(repository, new StaticFolderContentReader(false)).execute(
      folder.folderId
    );

    await expect(repository.findById(folder.folderId)).resolves.toBeNull();
  });

  it("GIVEN root folder WHEN deleted THEN a root operation conflict is thrown", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);

    await expect(
      new DeleteFolderUseCase(repository, new StaticFolderContentReader(false)).execute(
        ROOT_FOLDER_ID
      )
    ).rejects.toBeInstanceOf(RootFolderOperationNotAllowedError);
  });

  it("GIVEN a folder has child folders WHEN deleted THEN a non-empty folder error is thrown", async () => {
    const root = createRootFolder(now);
    const parent = createFolderRecord({
      folderId: "FLD-parent" as FolderId,
      name: "parent",
      parent: root,
      now
    });
    const child = createFolderRecord({
      folderId: "FLD-child" as FolderId,
      name: "child",
      parent,
      now
    });
    const repository = new InMemoryFolderRepository([root, parent, child]);

    await expect(
      new DeleteFolderUseCase(repository, new StaticFolderContentReader(false)).execute(
        parent.folderId
      )
    ).rejects.toBeInstanceOf(FolderNotEmptyError);
  });

  it("GIVEN a folder has assigned content WHEN deleted THEN a non-empty folder error is thrown", async () => {
    const root = createRootFolder(now);
    const folder = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "folder1",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, folder]);

    await expect(
      new DeleteFolderUseCase(repository, new StaticFolderContentReader(true)).execute(
        folder.folderId
      )
    ).rejects.toBeInstanceOf(FolderNotEmptyError);
  });

  it("GIVEN a folder has assigned static files WHEN deleted THEN a non-empty folder error is thrown", async () => {
    const root = createRootFolder(now);
    const folder = createFolderRecord({
      folderId: "FLD-folder1" as FolderId,
      name: "folder1",
      parent: root,
      now
    });
    const repository = new InMemoryFolderRepository([root, folder]);
    const staticFiles = new InMemoryStaticFileRepository([
      {
        fileId: "STF-file1",
        folderId: folder.folderId,
        filename: "manual.pdf",
        mimeType: "application/pdf",
        size: 7,
        path: "stored/STF-file1.pdf",
        createdAt: now,
        updatedAt: now
      }
    ]);

    await expect(
      new DeleteFolderUseCase(
        repository,
        new CompositeFolderContentReader(new StaticFolderContentReader(false), staticFiles)
      ).execute(folder.folderId)
    ).rejects.toBeInstanceOf(FolderNotEmptyError);
  });

  it("GIVEN a folder is missing WHEN deleted THEN a folder not found error is thrown", async () => {
    const repository = new InMemoryFolderRepository([createRootFolder(now)]);

    await expect(
      new DeleteFolderUseCase(repository, new StaticFolderContentReader(false)).execute(
        "FLD-missing" as FolderId
      )
    ).rejects.toBeInstanceOf(FolderNotFoundError);
  });
});

class StaticFolderIdGenerator implements FolderIdGenerator {
  constructor(private readonly folderId: FolderId) {}

  next(): FolderId {
    return this.folderId;
  }
}

class StaticFolderContentReader implements FolderContentReader {
  constructor(private readonly hasContent: boolean) {}

  async hasAssignedContent(): Promise<boolean> {
    return this.hasContent;
  }
}
