import type {
  ContentId,
  ContentRecord,
  ContentTypeSchemaDefinition,
  Folder,
  FolderCreateInput,
  FolderId,
  Permission,
  StaticFile,
  StaticFileId
} from "@ecmp/shared-types";
import {
  CMIS_REPOSITORY_ID,
  ROOT_FOLDER_ID,
  cmisBaseTypeDefinitions,
  cmisError,
  cmisObjectFromContentRecord,
  cmisObjectFromFolder,
  cmisObjectFromStaticFile,
  cmisRepositoryInfo,
  cmisServiceDocument,
  cmisTypeDefinitionFromSchema
} from "@ecmp/shared-types";
import {
  All,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { ServerResponse } from "node:http";

import { ContentTypeSchemaNotFoundError } from "../application/content-validation.errors";
import {
  ContentFolderNotFoundError,
  ContentNotFoundError,
  InvalidContentDataError
} from "../application/content.errors";
import {
  DeleteContentUseCase,
  GetContentUseCase,
  ListContentsUseCase
} from "../application/content.use-cases";
import {
  DuplicateFolderNameError,
  FolderNotEmptyError,
  FolderNotFoundError,
  InvalidFolderNameError,
  ParentFolderNotFoundError,
  RootFolderOperationNotAllowedError
} from "../application/folder.errors";
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  GetFolderUseCase,
  ListFoldersUseCase
} from "../application/folder.use-cases";
import {
  InvalidStaticFileNameError,
  MissingStaticFileUploadError,
  StaticFileFolderNotFoundError,
  StaticFileNotFoundError,
  StaticFileStorageError,
  StaticFileUploadTooLargeError,
  UnsupportedStaticFileUploadMimeTypeError
} from "../application/static-file.errors";
import {
  DeleteStaticFileUseCase,
  GetStaticFileUseCase,
  ListStaticFilesUseCase,
  UploadStaticFileUseCase
} from "../application/static-file.use-cases";
import type { ContentRecordEntity } from "../domain/content";
import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";
import type { FolderRecord } from "../domain/folder";
import {
  MAX_STATIC_FILE_SIZE_BYTES,
  type StaticFileEntity
} from "../domain/static-file";
import type { StaticFileStorage } from "../domain/static-file.storage";
import { CONTENT_TYPE_SCHEMA_READER, STATIC_FILE_STORAGE } from "./folder.providers";

interface UploadedCmisDocument {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const uploadLimits = {
  files: 1,
  fields: 4,
  fileSize: MAX_STATIC_FILE_SIZE_BYTES,
  fieldNestingDepth: 2
};

@Controller("api/cmis")
export class CmisController {
  constructor(
    @Inject(ListFoldersUseCase)
    private readonly listFolders: ListFoldersUseCase,
    @Inject(GetFolderUseCase)
    private readonly getFolder: GetFolderUseCase,
    @Inject(CreateFolderUseCase)
    private readonly createFolder: CreateFolderUseCase,
    @Inject(DeleteFolderUseCase)
    private readonly deleteFolder: DeleteFolderUseCase,
    @Inject(ListContentsUseCase)
    private readonly listContents: ListContentsUseCase,
    @Inject(GetContentUseCase)
    private readonly getContent: GetContentUseCase,
    @Inject(DeleteContentUseCase)
    private readonly deleteContent: DeleteContentUseCase,
    @Inject(ListStaticFilesUseCase)
    private readonly listStaticFiles: ListStaticFilesUseCase,
    @Inject(GetStaticFileUseCase)
    private readonly getStaticFile: GetStaticFileUseCase,
    @Inject(UploadStaticFileUseCase)
    private readonly uploadStaticFile: UploadStaticFileUseCase,
    @Inject(DeleteStaticFileUseCase)
    private readonly deleteStaticFile: DeleteStaticFileUseCase,
    @Inject(CONTENT_TYPE_SCHEMA_READER)
    private readonly schemaReader: ContentTypeSchemaReader,
    @Inject(STATIC_FILE_STORAGE)
    private readonly storage: StaticFileStorage
  ) {}

  @Get()
  serviceDocument(): ReturnType<typeof cmisServiceDocument> {
    return cmisServiceDocument();
  }

  @Get(":repositoryId")
  repositoryInfo(@Param("repositoryId") repositoryId: string): ReturnType<typeof cmisRepositoryInfo> {
    assertRepository(repositoryId);

    return cmisRepositoryInfo();
  }

  @Get(":repositoryId/types")
  async typeChildren(@Param("repositoryId") repositoryId: string) {
    assertRepository(repositoryId);

    const schemas = await this.schemaReader.listActive();

    return {
      types: [
        ...cmisBaseTypeDefinitions(),
        ...schemas.map((schema) => cmisTypeDefinitionFromSchema(schema))
      ]
    };
  }

  @Get(":repositoryId/children/:folderId")
  async children(
    @Param("repositoryId") repositoryId: string,
    @Param("folderId") folderId: string,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ) {
    assertRepository(repositoryId);
    const permissions = parsePermissions(permissionsHeader);

    try {
      const [folders, files, contents] = await Promise.all([
        this.listFolders.execute(folderId as FolderId),
        this.listStaticFiles.execute(folderId as FolderId),
        this.listContents.execute(folderId as FolderId)
      ]);

      return {
        objects: [
          ...folders.map((folder) => cmisObjectFromFolder(toFolderResponse(folder), permissions)),
          ...files.map((file) => cmisObjectFromStaticFile(toStaticFileResponse(file), permissions)),
          ...contents.map((content) =>
            cmisObjectFromContentRecord(toContentResponse(content), permissions)
          )
        ]
      };
    } catch (error) {
      throw mapCmisError(error);
    }
  }

  @Get(":repositoryId/object/:objectId")
  async objectById(
    @Param("repositoryId") repositoryId: string,
    @Param("objectId") objectId: string,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ) {
    assertRepository(repositoryId);

    return this.resolveObject(objectId, parsePermissions(permissionsHeader));
  }

  @Get(":repositoryId/object-by-path")
  async objectByPath(
    @Param("repositoryId") repositoryId: string,
    @Query("path") requestedPath: string | undefined,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ) {
    assertRepository(repositoryId);

    if (typeof requestedPath !== "string" || requestedPath.length === 0) {
      throw new CmisHttpException("invalidArgument", "CMIS object-by-path requires path.", 400);
    }

    try {
      const object = await this.resolveObjectByPath(
        requestedPath,
        parsePermissions(permissionsHeader)
      );

      if (!object) {
        throw new CmisHttpException("notFound", `CMIS object path '${requestedPath}' was not found.`, 404);
      }

      return object;
    } catch (error) {
      throw mapCmisError(error);
    }
  }

  @Get(":repositoryId/content/:fileId")
  async contentStream(
    @Param("repositoryId") repositoryId: string,
    @Param("fileId") fileId: string,
    @Res() response: ServerResponse
  ): Promise<void> {
    assertRepository(repositoryId);

    try {
      const file = await this.getStaticFile.execute(fileId as StaticFileId);
      const buffer = await this.storage.read(file.path);

      response.statusCode = 200;
      response.setHeader("content-type", file.mimeType);
      response.setHeader("content-length", buffer.length);
      response.setHeader(
        "content-disposition",
        `attachment; filename="${sanitizeHeaderValue(file.filename)}"`
      );
      response.end(buffer);
    } catch (error) {
      const mapped = mapCmisError(error);
      const status = mapped instanceof HttpException ? mapped.getStatus() : 500;
      const body = mapped instanceof HttpException ? mapped.getResponse() : cmisError("storage", "Request failed.");

      response.statusCode = status;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify(body));
    }
  }

  @Post(":repositoryId/folders")
  async createFolderObject(
    @Param("repositoryId") repositoryId: string,
    @Body() body: unknown,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ) {
    assertRepository(repositoryId);
    requirePermission(parsePermissions(permissionsHeader), "folder:create");

    try {
      const folder = await this.createFolder.execute(parseCreateFolderInput(body));

      return cmisObjectFromFolder(toFolderResponse(folder), parsePermissions(permissionsHeader));
    } catch (error) {
      throw mapCmisError(error);
    }
  }

  @Post(":repositoryId/documents")
  @UseInterceptors(FileInterceptor("file", { limits: uploadLimits }))
  async createDocument(
    @Param("repositoryId") repositoryId: string,
    @Body("parentId") parentId: string | undefined,
    @Body("folderId") folderId: string | undefined,
    @UploadedFile() file?: UploadedCmisDocument,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ) {
    assertRepository(repositoryId);
    requirePermission(parsePermissions(permissionsHeader), "file:create");
    const resolvedFolderId = parentId ?? folderId;

    if (typeof resolvedFolderId !== "string" || resolvedFolderId.length === 0) {
      throw new CmisHttpException("invalidArgument", "CMIS create-document requires parentId.", 400);
    }

    try {
      const uploaded = await this.uploadStaticFile.execute(
        file
          ? {
              folderId: resolvedFolderId as FolderId,
              filename: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              buffer: file.buffer
            }
          : null
      );

      return cmisObjectFromStaticFile(
        toStaticFileResponse(uploaded),
        parsePermissions(permissionsHeader)
      );
    } catch (error) {
      throw mapCmisError(error);
    }
  }

  @Delete(":repositoryId/object/:objectId")
  async deleteObject(
    @Param("repositoryId") repositoryId: string,
    @Param("objectId") objectId: string,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ): Promise<{ deleted: true; objectId: string }> {
    assertRepository(repositoryId);
    const permissions = parsePermissions(permissionsHeader);

    try {
      if (objectId.startsWith("FLD-")) {
        requirePermission(permissions, "folder:delete");
        await this.deleteFolder.execute(objectId as FolderId);
      } else if (objectId.startsWith("STF-")) {
        requirePermission(permissions, "file:delete");
        await this.deleteStaticFile.execute(objectId as StaticFileId);
      } else if (objectId.startsWith("RCD-")) {
        const content = await this.getContent.execute(objectId as ContentId);
        requirePermission(permissions, `${content.contentType}:delete`);
        await this.deleteContent.execute(objectId as ContentId);
      } else {
        throw new CmisHttpException("notSupported", `CMIS object '${objectId}' is not supported.`, 405);
      }

      return { deleted: true, objectId };
    } catch (error) {
      throw mapCmisError(error);
    }
  }

  @All(["query", "query/*path", "changes", "changes/*path", "relationships", "relationships/*path", "policies", "policies/*path", "renditions", "renditions/*path", "versions", "versions/*path", "acl", "acl/*path"])
  unsupportedKnownOperation(): never {
    throw new CmisHttpException(
      "notSupported",
      "The requested CMIS service is not supported by this repository.",
      405
    );
  }

  @All("*path")
  unsupportedOperation(): never {
    throw new CmisHttpException(
      "notSupported",
      "The requested CMIS operation is not supported by this repository.",
      405
    );
  }

  private async resolveObject(objectId: string, permissions: Permission[]) {
    try {
      if (objectId.startsWith("FLD-")) {
        return cmisObjectFromFolder(
          toFolderResponse(await this.getFolder.execute(objectId as FolderId)),
          permissions
        );
      }

      if (objectId.startsWith("STF-")) {
        return cmisObjectFromStaticFile(
          toStaticFileResponse(await this.getStaticFile.execute(objectId as StaticFileId)),
          permissions
        );
      }

      if (objectId.startsWith("RCD-")) {
        return cmisObjectFromContentRecord(
          toContentResponse(await this.getContent.execute(objectId as ContentId)),
          permissions
        );
      }

      throw new CmisHttpException("notFound", `CMIS object '${objectId}' was not found.`, 404);
    } catch (error) {
      throw mapCmisError(error);
    }
  }

  private async resolveObjectByPath(requestedPath: string, permissions: Permission[]) {
    const normalizedPath = requestedPath === "" ? "/" : requestedPath;
    const folders = await this.listFolders.execute();
    const folder = folders.find((candidate) => candidate.path === normalizedPath);

    if (folder) {
      return cmisObjectFromFolder(toFolderResponse(folder), permissions);
    }

    for (const candidateFolder of folders) {
      const [files, contents] = await Promise.all([
        this.listStaticFiles.execute(candidateFolder.folderId),
        this.listContents.execute(candidateFolder.folderId)
      ]);
      const matchedFile = files.find(
        (file) => joinObjectPath(candidateFolder.path, file.filename) === normalizedPath
      );

      if (matchedFile) {
        return cmisObjectFromStaticFile(toStaticFileResponse(matchedFile), permissions);
      }

      const matchedContent = contents.find(
        (content) => joinObjectPath(candidateFolder.path, content.contentId) === normalizedPath
      );

      if (matchedContent) {
        return cmisObjectFromContentRecord(toContentResponse(matchedContent), permissions);
      }
    }

    return null;
  }
}

function assertRepository(repositoryId: string): void {
  if (repositoryId !== CMIS_REPOSITORY_ID) {
    throw new CmisHttpException("notFound", `CMIS repository '${repositoryId}' was not found.`, 404);
  }
}

function parseCreateFolderInput(body: unknown): FolderCreateInput {
  if (!isPlainObject(body)) {
    throw new CmisHttpException("invalidArgument", "CMIS create-folder requires a body.", 400);
  }

  const name = body["name"];
  const parentId = body["parentId"] ?? body["parentFolderId"];

  if (typeof name !== "string" || typeof parentId !== "string") {
    throw new CmisHttpException("invalidArgument", "CMIS create-folder requires name and parentId.", 400);
  }

  return {
    name,
    parentFolderId: parentId as FolderId
  };
}

function parsePermissions(header: string | undefined): Permission[] {
  if (!header) {
    return [];
  }

  return header
    .split(",")
    .map((permission) => permission.trim())
    .filter((permission): permission is Permission => permission.includes(":"));
}

function requirePermission(permissions: Permission[], required: Permission): void {
  if (permissions.length === 0) {
    return;
  }

  const [resource, action] = required.split(":");
  const allowed = permissions.some((permission) => {
    const [ownedResource, ownedAction] = permission.split(":");

    return (
      (ownedResource === resource || ownedResource === "*") &&
      (ownedAction === action || ownedAction === "*")
    );
  });

  if (!allowed) {
    throw new CmisHttpException("permissionDenied", `Permission '${required}' is required.`, 403);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function toFolderResponse(folder: FolderRecord): Folder {
  return {
    folderId: folder.folderId,
    name: folder.name,
    parentFolderId: folder.parentFolderId,
    path: folder.path,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString()
  };
}

function toContentResponse(content: ContentRecordEntity): ContentRecord {
  return {
    contentId: content.contentId,
    folderId: content.folderId,
    contentType: content.contentType,
    schemaVersion: content.schemaVersion,
    version: content.version,
    status: content.status,
    data: content.data,
    createdAt: content.createdAt.toISOString(),
    updatedAt: content.updatedAt.toISOString()
  };
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

function mapCmisError(error: unknown): Error {
  if (error instanceof CmisHttpException) {
    return error;
  }

  if (error instanceof BadRequestException) {
    return new CmisHttpException("invalidArgument", "CMIS request is invalid.", 400);
  }

  if (
    error instanceof FolderNotFoundError ||
    error instanceof ParentFolderNotFoundError ||
    error instanceof ContentNotFoundError ||
    error instanceof ContentFolderNotFoundError ||
    error instanceof ContentTypeSchemaNotFoundError ||
    error instanceof StaticFileNotFoundError ||
    error instanceof StaticFileFolderNotFoundError
  ) {
    return new CmisHttpException("notFound", error.message, 404);
  }

  if (
    error instanceof InvalidFolderNameError ||
    error instanceof InvalidContentDataError ||
    error instanceof InvalidStaticFileNameError ||
    error instanceof MissingStaticFileUploadError
  ) {
    return new CmisHttpException("invalidArgument", error.message, 400);
  }

  if (
    error instanceof DuplicateFolderNameError ||
    error instanceof RootFolderOperationNotAllowedError ||
    error instanceof FolderNotEmptyError
  ) {
    return new CmisHttpException("constraint", error.message, 409);
  }

  if (error instanceof StaticFileUploadTooLargeError) {
    return new CmisHttpException("constraint", error.message, HttpStatus.PAYLOAD_TOO_LARGE);
  }

  if (error instanceof UnsupportedStaticFileUploadMimeTypeError) {
    return new CmisHttpException("constraint", error.message, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }

  if (error instanceof StaticFileStorageError) {
    return new CmisHttpException("storage", error.message, 500);
  }

  if (error instanceof Error) {
    return error;
  }

  return new CmisHttpException("storage", "Unknown CMIS error.", 500);
}

function joinObjectPath(folderPath: string, objectName: string): string {
  return folderPath === "/" ? `/${objectName}` : `${folderPath}/${objectName}`;
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n"]/g, "_");
}

class CmisHttpException extends HttpException {
  constructor(exception: Parameters<typeof cmisError>[0], message: string, status: number) {
    super(cmisError(exception, message), status);
  }
}
