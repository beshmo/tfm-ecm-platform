import type { FolderId, StaticFileId } from "@ecmp/shared-types";

export const MAX_STATIC_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_STATIC_FILE_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
] as const;

export type AllowedStaticFileMimeType = (typeof ALLOWED_STATIC_FILE_MIME_TYPES)[number];

export interface StaticFileEntity {
  fileId: StaticFileId;
  folderId: FolderId;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaticFileInput {
  fileId: StaticFileId;
  folderId: FolderId;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
  now?: Date;
}

const MAX_FILENAME_LENGTH = 255;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/u;
const UNSAFE_FILESYSTEM_SYMBOL_PATTERN = /[<>:"|?*]/u;

export class StaticFileNameValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaticFileNameValidationError";
  }
}

export class UnsupportedStaticFileMimeTypeError extends Error {
  constructor(readonly mimeType: string) {
    super(`Static file MIME type '${mimeType}' is not supported.`);
    this.name = "UnsupportedStaticFileMimeTypeError";
  }
}

export class StaticFileTooLargeError extends Error {
  constructor(readonly size: number) {
    super(`Static file size ${size} exceeds the maximum allowed size.`);
    this.name = "StaticFileTooLargeError";
  }
}

export function createStaticFile(input: CreateStaticFileInput): StaticFileEntity {
  const now = input.now ?? new Date();
  const filename = normalizeStaticFileName(input.filename);

  assertAllowedMimeType(input.mimeType);
  assertAllowedSize(input.size);

  return {
    fileId: input.fileId,
    folderId: input.folderId,
    filename,
    mimeType: input.mimeType,
    size: input.size,
    path: input.path,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}

export function renameStaticFile(
  file: StaticFileEntity,
  filename: string,
  now: Date = new Date()
): StaticFileEntity {
  return {
    ...cloneStaticFile(file),
    filename: normalizeStaticFileName(filename),
    updatedAt: new Date(now)
  };
}

export function normalizeStaticFileName(filename: unknown): string {
  if (typeof filename !== "string") {
    throw new StaticFileNameValidationError("Static file name must be a string.");
  }

  const normalizedName = filename.trim();

  if (normalizedName.length === 0) {
    throw new StaticFileNameValidationError("Static file name must not be empty.");
  }

  if (normalizedName.length > MAX_FILENAME_LENGTH) {
    throw new StaticFileNameValidationError("Static file name is too long.");
  }

  if (normalizedName === "." || normalizedName === "..") {
    throw new StaticFileNameValidationError("Static file name must not be a relative path segment.");
  }

  if (normalizedName.includes("/") || normalizedName.includes("\\")) {
    throw new StaticFileNameValidationError("Static file name must not contain path separators.");
  }

  if (CONTROL_CHARACTER_PATTERN.test(normalizedName)) {
    throw new StaticFileNameValidationError("Static file name must not contain control characters.");
  }

  if (UNSAFE_FILESYSTEM_SYMBOL_PATTERN.test(normalizedName)) {
    throw new StaticFileNameValidationError("Static file name contains unsafe filesystem symbols.");
  }

  return normalizedName;
}

export function assertAllowedMimeType(mimeType: string): void {
  if (!ALLOWED_STATIC_FILE_MIME_TYPES.includes(mimeType as AllowedStaticFileMimeType)) {
    throw new UnsupportedStaticFileMimeTypeError(mimeType);
  }
}

export function assertAllowedSize(size: number): void {
  if (!Number.isInteger(size) || size < 0 || size > MAX_STATIC_FILE_SIZE_BYTES) {
    throw new StaticFileTooLargeError(size);
  }
}

export function cloneStaticFile(file: StaticFileEntity): StaticFileEntity {
  return {
    ...file,
    createdAt: new Date(file.createdAt),
    updatedAt: new Date(file.updatedAt)
  };
}
