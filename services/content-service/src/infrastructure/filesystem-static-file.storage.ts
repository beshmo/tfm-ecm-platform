import { mkdir, rm, writeFile } from "node:fs/promises";
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

    const storageName = `${input.fileId}${extensionFor(input.mimeType, input.filename)}`;
    const fullPath = path.join(this.rootPath, storageName);

    await writeFile(fullPath, input.buffer);

    return { path: storageName };
  }

  async delete(storedPath: string): Promise<void> {
    const fullPath = resolveStoredPath(this.rootPath, storedPath);

    await rm(fullPath, { force: true });
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
    throw new Error("Static file path is outside the storage root.");
  }

  return fullPath;
}

function defaultStorageRoot(): string {
  return process.env["STATIC_FILE_STORAGE_ROOT"] ?? path.resolve(process.cwd(), ".ecmp-static-files");
}
