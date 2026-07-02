import type {
  FolderId,
  StaticFile,
  StaticFileId,
  StaticFileUpdateInput
} from "@ecmp/shared-types";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import {
  DeleteStaticFileUseCase,
  GetStaticFileUseCase,
  ListStaticFilesUseCase,
  RenameStaticFileUseCase,
  UploadStaticFileUseCase
} from "../application/static-file.use-cases";
import {
  InvalidStaticFileNameError,
  MissingStaticFileUploadError,
  StaticFileFolderNotFoundError,
  StaticFileNotFoundError,
  StaticFileStorageError,
  StaticFileSystemNamespaceError,
  StaticFileUploadTooLargeError,
  UnsupportedStaticFileUploadMimeTypeError
} from "../application/static-file.errors";
import {
  MAX_STATIC_FILE_SIZE_BYTES,
  type StaticFileEntity
} from "../domain/static-file";

interface UploadedStaticFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const uploadLimits = {
  files: 1,
  fields: 1,
  fileSize: MAX_STATIC_FILE_SIZE_BYTES,
  fieldNestingDepth: 2
};

@Controller("api/management/files")
export class FilesController {
  constructor(
    @Inject(ListStaticFilesUseCase)
    private readonly listStaticFiles: ListStaticFilesUseCase,
    @Inject(GetStaticFileUseCase)
    private readonly getStaticFile: GetStaticFileUseCase,
    @Inject(UploadStaticFileUseCase)
    private readonly uploadStaticFile: UploadStaticFileUseCase,
    @Inject(RenameStaticFileUseCase)
    private readonly renameStaticFile: RenameStaticFileUseCase,
    @Inject(DeleteStaticFileUseCase)
    private readonly deleteStaticFile: DeleteStaticFileUseCase
  ) {}

  @Get()
  async list(@Query("folderId") folderId?: string): Promise<StaticFile[]> {
    if (typeof folderId !== "string" || folderId.length === 0) {
      throw new BadRequestException("Document list requires folderId.");
    }

    try {
      const files = await this.listStaticFiles.execute(folderId as FolderId);

      return files.map(toStaticFileResponse);
    } catch (error) {
      throw mapStaticFileError(error);
    }
  }

  @Get(":fileId")
  async get(@Param("fileId") fileId: string): Promise<StaticFile> {
    try {
      return toStaticFileResponse(await this.getStaticFile.execute(fileId as StaticFileId));
    } catch (error) {
      throw mapStaticFileError(error);
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: uploadLimits }))
  async upload(
    @Body("folderId") folderId: string | undefined,
    @UploadedFile() file?: UploadedStaticFile
  ): Promise<StaticFile> {
    if (typeof folderId !== "string" || folderId.length === 0) {
      throw new BadRequestException("Document upload requires folderId.");
    }

    try {
      return toStaticFileResponse(
        await this.uploadStaticFile.execute(
          file
            ? {
                folderId: folderId as FolderId,
                filename: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                buffer: file.buffer
              }
            : null
        )
      );
    } catch (error) {
      throw mapStaticFileError(error);
    }
  }

  @Patch(":fileId")
  async rename(
    @Param("fileId") fileId: string,
    @Body() body: unknown
  ): Promise<StaticFile> {
    try {
      return toStaticFileResponse(
        await this.renameStaticFile.execute(fileId as StaticFileId, parseUpdateInput(body))
      );
    } catch (error) {
      throw mapStaticFileError(error);
    }
  }

  @Delete(":fileId")
  @HttpCode(204)
  async delete(@Param("fileId") fileId: string): Promise<void> {
    try {
      await this.deleteStaticFile.execute(fileId as StaticFileId);
    } catch (error) {
      throw mapStaticFileError(error);
    }
  }
}

function parseUpdateInput(body: unknown): StaticFileUpdateInput {
  if (!isPlainObject(body) || typeof body["filename"] !== "string") {
    throw new BadRequestException("Document update request requires filename.");
  }

  return { filename: body["filename"] };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function toStaticFileResponse(file: StaticFileEntity): StaticFile {
  return {
    fileId: file.fileId,
    folderId: file.folderId,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    path: file.path,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString()
  };
}

function mapStaticFileError(error: unknown): Error {
  if (error instanceof BadRequestException) {
    return error;
  }

  if (
    error instanceof InvalidStaticFileNameError ||
    error instanceof MissingStaticFileUploadError
  ) {
    return new BadRequestException(error.message);
  }

  if (
    error instanceof StaticFileNotFoundError ||
    error instanceof StaticFileFolderNotFoundError
  ) {
    return new NotFoundException(error.message);
  }

  if (error instanceof StaticFileSystemNamespaceError) {
    return new ConflictException(error.message);
  }

  if (error instanceof StaticFileUploadTooLargeError) {
    return new HttpException(error.message, HttpStatus.PAYLOAD_TOO_LARGE);
  }

  if (error instanceof UnsupportedStaticFileUploadMimeTypeError) {
    return new HttpException(error.message, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }

  if (error instanceof StaticFileStorageError) {
    return new InternalServerErrorException(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown document error.");
}
