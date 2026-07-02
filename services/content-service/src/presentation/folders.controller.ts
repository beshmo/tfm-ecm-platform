import type {
  Folder,
  FolderCreateInput,
  FolderId,
  FolderUpdateInput,
  PermissionAction
} from "@ecmp/shared-types";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";

import {
  DuplicateFolderNameError,
  FolderNotEmptyError,
  FolderNotFoundError,
  FolderSchemaNamespaceError,
  InvalidFolderNameError,
  ParentFolderNotFoundError,
  ProtectedFolderOperationNotAllowedError,
  RootFolderOperationNotAllowedError
} from "../application/folder.errors";
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  GetFolderUseCase,
  ListFoldersUseCase,
  MoveFolderUseCase,
  RenameFolderUseCase
} from "../application/folder.use-cases";
import type { FolderRecord } from "../domain/folder";
import { isSchemaNamespacePath } from "../domain/system-folder";
import { parseEcmpPermissions, requireSchemaAdmin } from "./schema-authorization";

@Controller("api/management/folders")
export class FoldersController {
  constructor(
    @Inject(ListFoldersUseCase)
    private readonly listFolders: ListFoldersUseCase,
    @Inject(GetFolderUseCase)
    private readonly getFolder: GetFolderUseCase,
    @Inject(CreateFolderUseCase)
    private readonly createFolder: CreateFolderUseCase,
    @Inject(RenameFolderUseCase)
    private readonly renameFolder: RenameFolderUseCase,
    @Inject(MoveFolderUseCase)
    private readonly moveFolder: MoveFolderUseCase,
    @Inject(DeleteFolderUseCase)
    private readonly deleteFolder: DeleteFolderUseCase
  ) {}

  @Get()
  async list(
    @Query("parentFolderId") parentFolderId?: string,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ): Promise<Folder[]> {
    try {
      if (parentFolderId) {
        await this.enforceSchemaNamespaceAdmin(parentFolderId as FolderId, "read", permissionsHeader);
      }

      const folders = await this.listFolders.execute(parentFolderId as FolderId | undefined);

      return folders.map(toFolderResponse);
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  @Get(":folderId")
  async get(
    @Param("folderId") folderId: string,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ): Promise<Folder> {
    try {
      const folder = await this.getFolder.execute(folderId as FolderId);

      if (isSchemaNamespacePath(folder.path)) {
        requireSchemaAdmin(parseEcmpPermissions(permissionsHeader), "read");
      }

      return toFolderResponse(folder);
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  @Post()
  async create(
    @Body() body: unknown,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ): Promise<Folder> {
    try {
      const input = parseCreateInput(body);
      await this.enforceSchemaNamespaceAdmin(input.parentFolderId, "create", permissionsHeader);

      return toFolderResponse(await this.createFolder.execute(input));
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  @Patch(":folderId")
  async rename(@Param("folderId") folderId: string, @Body() body: unknown): Promise<Folder> {
    try {
      return toFolderResponse(
        await this.renameFolder.execute(folderId as FolderId, parseUpdateInput(body))
      );
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  @Post(":folderId/move")
  async move(
    @Param("folderId") folderId: string,
    @Body() body: unknown,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ): Promise<Folder> {
    try {
      const targetParentFolderId = parseMoveInput(body);
      await this.enforceSchemaNamespaceAdmin(folderId as FolderId, "update", permissionsHeader);
      await this.enforceSchemaNamespaceAdmin(targetParentFolderId, "update", permissionsHeader);

      return toFolderResponse(
        await this.moveFolder.execute(folderId as FolderId, targetParentFolderId)
      );
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  @Delete(":folderId")
  @HttpCode(204)
  async delete(
    @Param("folderId") folderId: string,
    @Headers("x-ecmp-permissions") permissionsHeader?: string
  ): Promise<void> {
    try {
      await this.enforceSchemaNamespaceAdmin(folderId as FolderId, "delete", permissionsHeader);
      await this.deleteFolder.execute(folderId as FolderId);
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  /**
   * Requires administrator authorization when the folder is within the
   * `/system/schemas` schema namespace. Folders outside the namespace are
   * unaffected. Missing folders surface the underlying not-found error.
   */
  private async enforceSchemaNamespaceAdmin(
    folderId: FolderId,
    action: PermissionAction,
    permissionsHeader?: string
  ): Promise<void> {
    const folder = await this.getFolder.execute(folderId);

    if (isSchemaNamespacePath(folder.path)) {
      requireSchemaAdmin(parseEcmpPermissions(permissionsHeader), action);
    }
  }
}

function parseCreateInput(body: unknown): FolderCreateInput {
  const record = parseObjectBody(body);
  const name = record["name"];
  const parentFolderId = record["parentFolderId"];

  if (typeof name !== "string" || typeof parentFolderId !== "string") {
    throw new BadRequestException("Folder create request requires name and parentFolderId.");
  }

  return {
    name,
    parentFolderId: parentFolderId as FolderId
  };
}

function parseUpdateInput(body: unknown): FolderUpdateInput {
  const record = parseObjectBody(body);
  const name = record["name"];

  if (typeof name !== "string") {
    throw new BadRequestException("Folder update request requires name.");
  }

  return { name };
}

function parseMoveInput(body: unknown): FolderId {
  const record = parseObjectBody(body);
  const targetParentFolderId = record["targetParentFolderId"];

  if (typeof targetParentFolderId !== "string" || targetParentFolderId.length === 0) {
    throw new BadRequestException("Folder move request requires targetParentFolderId.");
  }

  return targetParentFolderId as FolderId;
}

function parseObjectBody(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BadRequestException("Request body must be a JSON object.");
  }

  return body as Record<string, unknown>;
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

function mapFolderError(error: unknown): Error {
  if (error instanceof BadRequestException) {
    return error;
  }

  if (error instanceof InvalidFolderNameError) {
    return new BadRequestException(error.message);
  }

  if (error instanceof FolderNotFoundError || error instanceof ParentFolderNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof DuplicateFolderNameError ||
    error instanceof RootFolderOperationNotAllowedError ||
    error instanceof FolderNotEmptyError ||
    error instanceof ProtectedFolderOperationNotAllowedError ||
    error instanceof FolderSchemaNamespaceError
  ) {
    return new ConflictException(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown folder error.");
}
