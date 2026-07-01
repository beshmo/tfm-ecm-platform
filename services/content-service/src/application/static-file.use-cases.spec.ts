import type { FolderId, StaticFileId } from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";
import { describe, expect, it, vi } from "vitest";

import type { StaticFileIdGenerator } from "../domain/static-file-id-generator";
import type { StaticFileStorage, StaticFileStorageSaveInput } from "../domain/static-file.storage";
import { InMemoryFolderRepository } from "../infrastructure/in-memory-folder.repository";
import { InMemoryStaticFileRepository } from "../infrastructure/in-memory-static-file.repository";
import {
  InvalidStaticFileNameError,
  MissingStaticFileUploadError,
  StaticFileFolderNotFoundError,
  StaticFileNotFoundError,
  StaticFileStorageError,
  StaticFileUploadTooLargeError,
  UnsupportedStaticFileUploadMimeTypeError
} from "./static-file.errors";
import {
  DeleteStaticFileUseCase,
  GetStaticFileUseCase,
  ListStaticFilesUseCase,
  RenameStaticFileUseCase,
  UploadStaticFileUseCase
} from "./static-file.use-cases";

describe("static file use cases", () => {
  const now = new Date("2026-06-30T10:00:00.000Z");
  const later = new Date("2026-06-30T11:00:00.000Z");

  it("GIVEN a valid upload WHEN executed THEN metadata is stored with generated ID and storage path", async () => {
    const repository = new InMemoryStaticFileRepository();
    const storage = new MemoryStaticFileStorage();
    const useCase = new UploadStaticFileUseCase(
      repository,
      new InMemoryFolderRepository(),
      storage,
      new StaticStaticFileIdGenerator("STF-file1" as StaticFileId),
      () => now
    );

    const file = await useCase.execute(upload());

    expect(file).toMatchObject({
      fileId: "STF-file1",
      folderId: ROOT_FOLDER_ID,
      filename: "manual.pdf",
      mimeType: "application/pdf",
      size: 7,
      path: "stored/STF-file1"
    });
    expect(file.createdAt).toEqual(now);
    await expect(repository.findById(file.fileId)).resolves.toMatchObject({
      filename: "manual.pdf"
    });
  });

  it("GIVEN files in folders WHEN listed THEN only matching folder files are returned", async () => {
    const repository = new InMemoryStaticFileRepository();
    const storage = new MemoryStaticFileStorage();
    const rootUpload = new UploadStaticFileUseCase(
      repository,
      new InMemoryFolderRepository(),
      storage,
      new StaticStaticFileIdGenerator("STF-root" as StaticFileId),
      () => now
    );
    await rootUpload.execute(upload());
    await repository.save({
      fileId: "STF-child" as StaticFileId,
      folderId: "FLD-child" as FolderId,
      filename: "child.txt",
      mimeType: "text/plain",
      size: 5,
      path: "stored/STF-child",
      createdAt: later,
      updatedAt: later
    });

    const files = await new ListStaticFilesUseCase(repository).execute(ROOT_FOLDER_ID);

    expect(files.map((file) => file.fileId)).toEqual(["STF-root"]);
  });

  it("GIVEN a file exists WHEN retrieved and renamed THEN metadata is returned and updated", async () => {
    const repository = new InMemoryStaticFileRepository();
    const storage = new MemoryStaticFileStorage();
    const uploaded = await new UploadStaticFileUseCase(
      repository,
      new InMemoryFolderRepository(),
      storage,
      new StaticStaticFileIdGenerator("STF-file1" as StaticFileId),
      () => now
    ).execute(upload());

    const retrieved = await new GetStaticFileUseCase(repository).execute(uploaded.fileId);
    const renamed = await new RenameStaticFileUseCase(repository, () => later).execute(
      uploaded.fileId,
      { filename: " manual-v2.pdf " }
    );

    expect(retrieved.fileId).toBe("STF-file1");
    expect(renamed).toMatchObject({
      fileId: "STF-file1",
      filename: "manual-v2.pdf",
      path: uploaded.path,
      mimeType: uploaded.mimeType,
      size: uploaded.size
    });
    expect(renamed.createdAt).toEqual(now);
    expect(renamed.updatedAt).toEqual(later);
  });

  it("GIVEN a file exists WHEN deleted THEN metadata and binary storage are removed", async () => {
    const repository = new InMemoryStaticFileRepository();
    const storage = new MemoryStaticFileStorage();
    const uploaded = await new UploadStaticFileUseCase(
      repository,
      new InMemoryFolderRepository(),
      storage,
      new StaticStaticFileIdGenerator("STF-file1" as StaticFileId),
      () => now
    ).execute(upload());

    await new DeleteStaticFileUseCase(repository, storage).execute(uploaded.fileId);

    await expect(repository.findById(uploaded.fileId)).resolves.toBeNull();
    expect(storage.deletedPaths).toEqual(["stored/STF-file1"]);
  });

  it("GIVEN invalid upload inputs WHEN executed THEN application errors are thrown", async () => {
    const repository = new InMemoryStaticFileRepository();
    const storage = new MemoryStaticFileStorage();
    const useCase = new UploadStaticFileUseCase(
      repository,
      new InMemoryFolderRepository(),
      storage,
      new StaticStaticFileIdGenerator("STF-file1" as StaticFileId)
    );

    await expect(useCase.execute(null)).rejects.toBeInstanceOf(MissingStaticFileUploadError);
    await expect(useCase.execute(upload({ folderId: "FLD-missing" as FolderId }))).rejects.toBeInstanceOf(
      StaticFileFolderNotFoundError
    );
    await expect(useCase.execute(upload({ filename: "bad/name.pdf" }))).rejects.toBeInstanceOf(
      InvalidStaticFileNameError
    );
    await expect(useCase.execute(upload({ mimeType: "application/x-msdownload" }))).rejects.toBeInstanceOf(
      UnsupportedStaticFileUploadMimeTypeError
    );
    await expect(useCase.execute(upload({ size: 10 * 1024 * 1024 + 1 }))).rejects.toBeInstanceOf(
      StaticFileUploadTooLargeError
    );
  });

  it("GIVEN missing records or storage failure WHEN operations run THEN errors are thrown", async () => {
    const repository = new InMemoryStaticFileRepository();
    const storage = new MemoryStaticFileStorage();

    await expect(
      new GetStaticFileUseCase(repository).execute("STF-missing" as StaticFileId)
    ).rejects.toBeInstanceOf(StaticFileNotFoundError);
    await expect(
      new RenameStaticFileUseCase(repository).execute("STF-missing" as StaticFileId, {
        filename: "new.pdf"
      })
    ).rejects.toBeInstanceOf(StaticFileNotFoundError);
    await expect(
      new DeleteStaticFileUseCase(repository, storage).execute("STF-missing" as StaticFileId)
    ).rejects.toBeInstanceOf(StaticFileNotFoundError);

    const uploaded = await new UploadStaticFileUseCase(
      repository,
      new InMemoryFolderRepository(),
      storage,
      new StaticStaticFileIdGenerator("STF-file1" as StaticFileId),
      () => now
    ).execute(upload());
    storage.deleteMock.mockRejectedValueOnce(new Error("disk failure"));

    await expect(
      new DeleteStaticFileUseCase(repository, storage).execute(uploaded.fileId)
    ).rejects.toBeInstanceOf(StaticFileStorageError);
  });

  it("GIVEN metadata persistence fails after binary storage WHEN uploaded THEN stored file cleanup is attempted", async () => {
    const storage = new MemoryStaticFileStorage();
    const repository = new InMemoryStaticFileRepository();
    const save = vi.spyOn(repository, "save").mockRejectedValueOnce(new Error("metadata failed"));
    const useCase = new UploadStaticFileUseCase(
      repository,
      new InMemoryFolderRepository(),
      storage,
      new StaticStaticFileIdGenerator("STF-file1" as StaticFileId)
    );

    await expect(useCase.execute(upload())).rejects.toBeInstanceOf(StaticFileStorageError);

    expect(save).toHaveBeenCalled();
    expect(storage.deletedPaths).toEqual(["stored/STF-file1"]);
  });
});

function upload(
  overrides: Partial<{
    folderId: FolderId;
    filename: string;
    mimeType: string;
    size: number;
    buffer: Buffer;
  }> = {}
) {
  const buffer = overrides.buffer ?? Buffer.from("content");

  return {
    folderId: overrides.folderId ?? ROOT_FOLDER_ID,
    filename: overrides.filename ?? "manual.pdf",
    mimeType: overrides.mimeType ?? "application/pdf",
    size: overrides.size ?? buffer.length,
    buffer
  };
}

class StaticStaticFileIdGenerator implements StaticFileIdGenerator {
  constructor(private readonly fileId: StaticFileId) {}

  next(): StaticFileId {
    return this.fileId;
  }
}

class MemoryStaticFileStorage implements StaticFileStorage {
  readonly deletedPaths: string[] = [];
  readonly deleteMock = vi.fn(async (path: string) => {
    this.deletedPaths.push(path);
  });
  readonly files = new Map<string, Buffer>();

  async save(input: StaticFileStorageSaveInput): Promise<{ path: string }> {
    const path = `stored/${input.fileId}`;

    this.files.set(path, input.buffer);

    return { path };
  }

  async read(path: string): Promise<Buffer> {
    const file = this.files.get(path);

    if (!file) {
      throw new Error("missing file");
    }

    return file;
  }

  async delete(path: string): Promise<void> {
    await this.deleteMock(path);
  }
}
