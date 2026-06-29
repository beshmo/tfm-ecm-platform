import type {
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";
import { Controller, Get, Inject, NotFoundException, Param } from "@nestjs/common";

import {
  GetContentTypeSchemaUseCase,
  GetContentTypeSchemaVersionUseCase,
  ListContentTypeSchemasUseCase
} from "../application/content-type-schema.use-cases";
import { ContentTypeSchemaNotFoundError } from "../domain/content-type-schema.errors";

@Controller("api/management/content-types")
export class ContentTypeSchemasController {
  constructor(
    @Inject(ListContentTypeSchemasUseCase)
    private readonly listSchemas: ListContentTypeSchemasUseCase,
    @Inject(GetContentTypeSchemaUseCase)
    private readonly getLatestSchema: GetContentTypeSchemaUseCase,
    @Inject(GetContentTypeSchemaVersionUseCase)
    private readonly getSchemaVersion: GetContentTypeSchemaVersionUseCase
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
}

function mapContentTypeSchemaError(error: unknown): Error {
  if (error instanceof ContentTypeSchemaNotFoundError) {
    return new NotFoundException(error.message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unknown content type schema error.");
}
