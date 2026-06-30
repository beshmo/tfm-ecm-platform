import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";
import { SchemaValidationError } from "@ecmp/shared-yaml";
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
  NotFoundException,
  Param,
  Post,
  Put
} from "@nestjs/common";

import {
  CreateContentTypeSchemaUseCase,
  DeactivateContentTypeSchemaVersionUseCase,
  GetContentTypeSchemaUseCase,
  GetContentTypeSchemaVersionUseCase,
  ListContentTypeSchemasUseCase,
  ReplaceContentTypeSchemaVersionUseCase
} from "../application/content-type-schema.use-cases";
import {
  ContentTypeSchemaAlreadyExistsError,
  ContentTypeSchemaInactiveError,
  ContentTypeSchemaMismatchError,
  ContentTypeSchemaNotFoundError
} from "../domain/content-type-schema.errors";
import type { ContentTypeSchemaConfig } from "./content-type-schema.config";
import { CONTENT_TYPE_SCHEMA_CONFIG } from "./content-type-schema.providers";

interface SchemaSourceRequestBody {
  schemaSource?: unknown;
}

@Controller("api/management/content-types")
export class ContentTypeSchemasController {
  constructor(
    @Inject(ListContentTypeSchemasUseCase)
    private readonly listSchemas: ListContentTypeSchemasUseCase,
    @Inject(GetContentTypeSchemaUseCase)
    private readonly getLatestSchema: GetContentTypeSchemaUseCase,
    @Inject(GetContentTypeSchemaVersionUseCase)
    private readonly getSchemaVersion: GetContentTypeSchemaVersionUseCase,
    @Inject(CreateContentTypeSchemaUseCase)
    private readonly createSchema: CreateContentTypeSchemaUseCase,
    @Inject(ReplaceContentTypeSchemaVersionUseCase)
    private readonly replaceSchema: ReplaceContentTypeSchemaVersionUseCase,
    @Inject(DeactivateContentTypeSchemaVersionUseCase)
    private readonly deactivateSchema: DeactivateContentTypeSchemaVersionUseCase,
    @Inject(CONTENT_TYPE_SCHEMA_CONFIG)
    private readonly config: ContentTypeSchemaConfig
  ) {}

  @Get()
  async list(): Promise<ContentTypeSchemaSummary[]> {
    return this.listSchemas.execute();
  }

  @Get(":name")
  async getLatest(@Param("name") name: string): Promise<ContentTypeSchemaDefinition> {
    try {
      return await this.getLatestSchema.execute(name as ContentTypeName);
    } catch (error) {
      throw mapContentTypeSchemaError(error);
    }
  }

  @Get(":name/versions/:version")
  async getVersion(
    @Param("name") name: string,
    @Param("version") version: string
  ): Promise<ContentTypeSchemaDefinition> {
    try {
      return await this.getSchemaVersion.execute(
        name as ContentTypeName,
        version as ContentTypeVersion
      );
    } catch (error) {
      throw mapContentTypeSchemaError(error);
    }
  }

  @Post()
  async create(
    @Body() body: SchemaSourceRequestBody
  ): Promise<ContentTypeSchemaDefinition> {
    try {
      return await this.createSchema.execute(this.readSchemaSource(body));
    } catch (error) {
      throw mapContentTypeSchemaError(error);
    }
  }

  @Put(":name/versions/:version")
  async replace(
    @Param("name") name: string,
    @Param("version") version: string,
    @Body() body: SchemaSourceRequestBody
  ): Promise<ContentTypeSchemaDefinition> {
    try {
      return await this.replaceSchema.execute(
        name as ContentTypeName,
        version as ContentTypeVersion,
        this.readSchemaSource(body)
      );
    } catch (error) {
      throw mapContentTypeSchemaError(error);
    }
  }

  @Delete(":name/versions/:version")
  @HttpCode(204)
  async deactivate(
    @Param("name") name: string,
    @Param("version") version: string
  ): Promise<void> {
    try {
      await this.deactivateSchema.execute(name as ContentTypeName, version as ContentTypeVersion);
    } catch (error) {
      throw mapContentTypeSchemaError(error);
    }
  }

  private readSchemaSource(body: SchemaSourceRequestBody): string {
    if (typeof body.schemaSource !== "string") {
      throw new BadRequestException(validationBody("Content type schema request is invalid.", [
        "schemaSource must be a string."
      ]));
    }

    if (byteLength(body.schemaSource) > this.config.maxYamlSourceBytes) {
      throw new HttpException(
        validationBody("Content type schema source exceeds the maximum allowed size.", [
          `schemaSource must be at most ${this.config.maxYamlSourceBytes} bytes.`
        ]),
        HttpStatus.PAYLOAD_TOO_LARGE
      );
    }

    return body.schemaSource;
  }
}

function mapContentTypeSchemaError(error: unknown): Error {
  if (error instanceof SchemaValidationError) {
    return new BadRequestException(validationBody(error.message, error.issues));
  }

  if (error instanceof ContentTypeSchemaAlreadyExistsError) {
    return new ConflictException(error.message);
  }

  if (
    error instanceof ContentTypeSchemaMismatchError ||
    error instanceof ContentTypeSchemaInactiveError
  ) {
    return new ConflictException(error.message);
  }

  if (error instanceof ContentTypeSchemaNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown content type schema error.");
}

function validationBody(message: string, issues: string[]): {
  message: string;
  errors: Array<{ message: string }>;
} {
  return {
    message,
    errors: issues.map((issue) => ({ message: issue }))
  };
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
