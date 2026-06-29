import type { Folder, FolderCreateInput, FolderId, FolderUpdateInput } from "@ecmp/shared-types";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
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
  InvalidFolderNameError,
  ParentFolderNotFoundError,
  RootFolderOperationNotAllowedError
} from "../application/folder.errors";
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  GetFolderUseCase,
  ListFoldersUseCase,
  RenameFolderUseCase
} from "../application/folder.use-cases";
import type { FolderRecord } from "../domain/folder";

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
    @Inject(DeleteFolderUseCase)
    private readonly deleteFolder: DeleteFolderUseCase
  ) {}

  @Get()
  async list(@Query("parentFolderId") parentFolderId?: string): Promise<Folder[]> {
    try {
      const folders = await this.listFolders.execute(parentFolderId as FolderId | undefined);

      return folders.map(toFolderResponse);
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  @Get(":folderId")
  async get(@Param("folderId") folderId: string): Promise<Folder> {
    try {
      return toFolderResponse(await this.getFolder.execute(folderId as FolderId));
    } catch (error) {
      throw mapFolderError(error);
    }
  }

  @Post()
  async create(@Body() body: unknown): Promise<Folder> {
    try {
      return toFolderResponse(await this.createFolder.execute(parseCreateInput(body)));
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

  @Delete(":folderId")
  @HttpCode(204)
  async delete(@Param("folderId") folderId: string): Promise<void> {
    try {
      await this.deleteFolder.execute(folderId as FolderId);
    } catch (error) {
      throw mapFolderError(error);
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
    error instanceof FolderNotEmptyError
  ) {
    return new ConflictException(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown folder error.");
}
