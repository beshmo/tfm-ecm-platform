import { INITIAL_GENERIC_CONTENT_TYPE_SCHEMA } from "@ecmp/shared-types";
import { StrictYamlSchemaParser, type SchemaParser } from "@ecmp/shared-yaml";

import {
  CreateContentTypeSchemaUseCase,
  DeactivateContentTypeSchemaVersionUseCase,
  GetContentTypeSchemaUseCase,
  GetContentTypeSchemaVersionUseCase,
  ListContentTypeSchemasUseCase,
  ReplaceContentTypeSchemaVersionUseCase
} from "../application/content-type-schema.use-cases";
import { createContentTypeSchemaRecord } from "../domain/content-type-schema";
import type { ContentTypeSchemaRepository } from "../domain/content-type-schema.repository";
import { InMemoryContentTypeSchemaRepository } from "../infrastructure/in-memory-content-type-schema.repository";

export const CONTENT_TYPE_SCHEMA_REPOSITORY = Symbol("CONTENT_TYPE_SCHEMA_REPOSITORY");
export const SCHEMA_PARSER = Symbol("SCHEMA_PARSER");

export const contentTypeSchemaProviders = [
  {
    provide: CONTENT_TYPE_SCHEMA_REPOSITORY,
    useFactory: async (): Promise<ContentTypeSchemaRepository> => {
      const repository = new InMemoryContentTypeSchemaRepository();

      await repository.save(createContentTypeSchemaRecord(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA));

      return repository;
    }
  },
  {
    provide: SCHEMA_PARSER,
    useClass: StrictYamlSchemaParser
  },
  {
    provide: CreateContentTypeSchemaUseCase,
    useFactory: (
      parser: SchemaParser,
      repository: ContentTypeSchemaRepository
    ): CreateContentTypeSchemaUseCase => new CreateContentTypeSchemaUseCase(parser, repository),
    inject: [SCHEMA_PARSER, CONTENT_TYPE_SCHEMA_REPOSITORY]
  },
  {
    provide: ReplaceContentTypeSchemaVersionUseCase,
    useFactory: (
      parser: SchemaParser,
      repository: ContentTypeSchemaRepository
    ): ReplaceContentTypeSchemaVersionUseCase =>
      new ReplaceContentTypeSchemaVersionUseCase(parser, repository),
    inject: [SCHEMA_PARSER, CONTENT_TYPE_SCHEMA_REPOSITORY]
  },
  {
    provide: GetContentTypeSchemaUseCase,
    useFactory: (repository: ContentTypeSchemaRepository): GetContentTypeSchemaUseCase =>
      new GetContentTypeSchemaUseCase(repository),
    inject: [CONTENT_TYPE_SCHEMA_REPOSITORY]
  },
  {
    provide: GetContentTypeSchemaVersionUseCase,
    useFactory: (repository: ContentTypeSchemaRepository): GetContentTypeSchemaVersionUseCase =>
      new GetContentTypeSchemaVersionUseCase(repository),
    inject: [CONTENT_TYPE_SCHEMA_REPOSITORY]
  },
  {
    provide: ListContentTypeSchemasUseCase,
    useFactory: (repository: ContentTypeSchemaRepository): ListContentTypeSchemasUseCase =>
      new ListContentTypeSchemasUseCase(repository),
    inject: [CONTENT_TYPE_SCHEMA_REPOSITORY]
  },
  {
    provide: DeactivateContentTypeSchemaVersionUseCase,
    useFactory: (repository: ContentTypeSchemaRepository): DeactivateContentTypeSchemaVersionUseCase =>
      new DeactivateContentTypeSchemaVersionUseCase(repository),
    inject: [CONTENT_TYPE_SCHEMA_REPOSITORY]
  }
];
