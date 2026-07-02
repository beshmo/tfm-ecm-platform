import type {
  ContentCreateInput,
  ContentId,
  ContentPatchInput,
  ContentRecord,
  ContentReplaceInput,
  ContentTypeName,
  ContentTypeVersion,
  FolderId
} from "@ecmp/shared-types";
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
  Put,
  Query
} from "@nestjs/common";

import { ContentTypeSchemaNotFoundError } from "../application/content-validation.errors";
import {
  ContentFolderNotFoundError,
  ContentNotFoundError,
  ContentSystemNamespaceError,
  InvalidContentDataError
} from "../application/content.errors";
import {
  CreateContentUseCase,
  DeleteContentUseCase,
  GetContentUseCase,
  ListContentsUseCase,
  PatchContentUseCase,
  ReplaceContentUseCase
} from "../application/content.use-cases";
import { ImmutableContentTypeError, type ContentRecordEntity } from "../domain/content";

@Controller("api/management/contents")
export class ContentsController {
  constructor(
    @Inject(ListContentsUseCase)
    private readonly listContents: ListContentsUseCase,
    @Inject(GetContentUseCase)
    private readonly getContent: GetContentUseCase,
    @Inject(CreateContentUseCase)
    private readonly createContent: CreateContentUseCase,
    @Inject(ReplaceContentUseCase)
    private readonly replaceContent: ReplaceContentUseCase,
    @Inject(PatchContentUseCase)
    private readonly patchContent: PatchContentUseCase,
    @Inject(DeleteContentUseCase)
    private readonly deleteContent: DeleteContentUseCase
  ) {}

  @Get()
  async list(@Query("folderId") folderId?: string): Promise<ContentRecord[]> {
    try {
      const contents = await this.listContents.execute(folderId as FolderId | undefined);

      return contents.map(toContentResponse);
    } catch (error) {
      throw mapContentError(error);
    }
  }

  @Get(":contentId")
  async get(@Param("contentId") contentId: string): Promise<ContentRecord> {
    try {
      return toContentResponse(await this.getContent.execute(contentId as ContentId));
    } catch (error) {
      throw mapContentError(error);
    }
  }

  @Post()
  async create(@Body() body: unknown): Promise<ContentRecord> {
    try {
      return toContentResponse(await this.createContent.execute(parseCreateInput(body)));
    } catch (error) {
      throw mapContentError(error);
    }
  }

  @Put(":contentId")
  async replace(
    @Param("contentId") contentId: string,
    @Body() body: unknown
  ): Promise<ContentRecord> {
    try {
      return toContentResponse(
        await this.replaceContent.execute(contentId as ContentId, parseReplaceInput(body))
      );
    } catch (error) {
      throw mapContentError(error);
    }
  }

  @Patch(":contentId")
  async patch(
    @Param("contentId") contentId: string,
    @Body() body: unknown
  ): Promise<ContentRecord> {
    try {
      return toContentResponse(
        await this.patchContent.execute(contentId as ContentId, parsePatchInput(body))
      );
    } catch (error) {
      throw mapContentError(error);
    }
  }

  @Delete(":contentId")
  @HttpCode(204)
  async delete(@Param("contentId") contentId: string): Promise<void> {
    try {
      await this.deleteContent.execute(contentId as ContentId);
    } catch (error) {
      throw mapContentError(error);
    }
  }
}

function parseCreateInput(body: unknown): ContentCreateInput {
  const record = parseObjectBody(body);
  const folderId = record["folderId"];
  const contentType = record["contentType"];
  const schemaVersion = record["schemaVersion"];
  const data = record["data"];

  if (typeof folderId !== "string" || typeof contentType !== "string" || !isPlainObject(data)) {
    throw new BadRequestException(
      "Content create request requires folderId, contentType, and data."
    );
  }

  return {
    folderId: folderId as FolderId,
    contentType,
    ...(schemaVersion === undefined ? {} : { schemaVersion: parseSchemaVersion(schemaVersion) }),
    data
  };
}

function parseReplaceInput(body: unknown): ContentReplaceInput {
  const record = parseObjectBody(body);
  const folderId = record["folderId"];
  const contentType = record["contentType"];
  const schemaVersion = record["schemaVersion"];
  const data = record["data"];

  if (typeof folderId !== "string" || !isPlainObject(data)) {
    throw new BadRequestException("Content replace request requires folderId and data.");
  }

  return {
    folderId: folderId as FolderId,
    ...(contentType === undefined ? {} : { contentType: parseContentType(contentType) }),
    ...(schemaVersion === undefined ? {} : { schemaVersion: parseSchemaVersion(schemaVersion) }),
    data
  };
}

function parsePatchInput(body: unknown): ContentPatchInput {
  const record = parseObjectBody(body);
  const folderId = record["folderId"];
  const contentType = record["contentType"];
  const schemaVersion = record["schemaVersion"];
  const data = record["data"];

  if (folderId !== undefined && typeof folderId !== "string") {
    throw new BadRequestException("Content patch folderId must be a string.");
  }

  if (data !== undefined && !isPlainObject(data)) {
    throw new BadRequestException("Content patch data must be a JSON object.");
  }

  return {
    ...(folderId === undefined ? {} : { folderId: folderId as FolderId }),
    ...(contentType === undefined ? {} : { contentType: parseContentType(contentType) }),
    ...(schemaVersion === undefined ? {} : { schemaVersion: parseSchemaVersion(schemaVersion) }),
    ...(data === undefined ? {} : { data })
  };
}

function parseObjectBody(body: unknown): Record<string, unknown> {
  if (!isPlainObject(body)) {
    throw new BadRequestException("Request body must be a JSON object.");
  }

  return body;
}

function parseContentType(value: unknown): ContentTypeName {
  if (typeof value !== "string") {
    throw new BadRequestException("contentType must be a string.");
  }

  return value;
}

function parseSchemaVersion(value: unknown): ContentTypeVersion {
  if (typeof value !== "string") {
    throw new BadRequestException("schemaVersion must be a string.");
  }

  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
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

function mapContentError(error: unknown): Error {
  if (error instanceof BadRequestException) {
    return error;
  }

  if (error instanceof InvalidContentDataError) {
    return new BadRequestException({
      message: error.message,
      errors: error.errors
    });
  }

  if (
    error instanceof ContentNotFoundError ||
    error instanceof ContentFolderNotFoundError ||
    error instanceof ContentTypeSchemaNotFoundError
  ) {
    return new NotFoundException(error.message);
  }

  if (
    error instanceof ImmutableContentTypeError ||
    error instanceof ContentSystemNamespaceError
  ) {
    return new ConflictException(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown content error.");
}
