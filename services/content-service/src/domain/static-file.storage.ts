import type { StaticFileId } from "@ecmp/shared-types";

export interface StaticFileStorageSaveInput {
  fileId: StaticFileId;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface StaticFileStorage {
  save(input: StaticFileStorageSaveInput): Promise<{ path: string }>;
  read(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}
