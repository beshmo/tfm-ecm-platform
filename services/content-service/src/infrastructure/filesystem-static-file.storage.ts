import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { StaticFileStorage, StaticFileStorageSaveInput } from "../domain/static-file.storage";

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp"
};

export class FilesystemStaticFileStorage implements StaticFileStorage {
  constructor(private readonly rootPath: string = defaultStorageRoot()) {}

  async save(input: StaticFileStorageSaveInput): Promise<{ path: string }> {
    await mkdir(this.rootPath, { recursive: true });
    await mkdir(this.temporaryPath(), { recursive: true });

    const storageName = `${input.fileId}${extensionFor(input.mimeType, input.filename)}`;
    const temporaryName = path.join(".tmp", `${input.fileId}.${randomUUID()}.upload`);
    const temporaryPath = resolveStoredPath(this.rootPath, temporaryName);
    const fullPath = resolveStoredPath(this.rootPath, storageName);

    try {
      await writeFile(temporaryPath, input.buffer);
      await rename(temporaryPath, fullPath);
    } catch (error) {
      await cleanupTemporaryFile(temporaryPath);
      throw error;
    }

    return { path: storageName };
  }

  async delete(storedPath: string): Promise<void> {
    const fullPath = resolveStoredPath(this.rootPath, storedPath);

    await rm(fullPath, { force: true });
  }

  async read(storedPath: string): Promise<Buffer> {
    const fullPath = resolveStoredPath(this.rootPath, storedPath);

    return readFile(fullPath);
  }

  private temporaryPath(): string {
    return path.join(this.rootPath, ".tmp");
  }
}

function extensionFor(mimeType: string, filename: string): string {
  const mimeExtension = MIME_TYPE_EXTENSIONS[mimeType];

  if (mimeExtension) {
    return mimeExtension;
  }

  const extension = path.extname(filename);

  return extension.length <= 12 ? extension : "";
}

function resolveStoredPath(rootPath: string, storedPath: string): string {
  const fullPath = path.resolve(rootPath, storedPath);
  const resolvedRootPath = path.resolve(rootPath);

  if (fullPath !== resolvedRootPath && !fullPath.startsWith(`${resolvedRootPath}${path.sep}`)) {
    throw new Error("Document path is outside the storage root.");
  }

  return fullPath;
}

async function cleanupTemporaryFile(temporaryPath: string): Promise<void> {
  try {
    await rm(temporaryPath, { force: true });
  } catch {
    // Best-effort cleanup should not hide the original filesystem failure.
  }
}

function defaultStorageRoot(): string {
  return process.env["STATIC_FILE_STORAGE_ROOT"] ?? path.resolve(process.cwd(), ".ecmp-static-files");
}
