import { INITIAL_GENERIC_CONTENT_TYPE_SCHEMA } from "@ecmp/shared-types";
import { StrictYamlSchemaParser, type SchemaParser } from "@ecmp/shared-yaml";

import {
  CreateContentTypeSchemaUseCase,
  DeactivateContentTypeSchemaVersionUseCase,
  GetContentTypeSchemaUseCase,
  GetContentTypeSchemaVersionUseCase,
  ListContentTypeDefinitionsUseCase,
  ListContentTypeSchemasUseCase,
  MoveContentTypeDefinitionUseCase,
  ReplaceContentTypeSchemaVersionUseCase
} from "../application/content-type-schema.use-cases";
import { createContentTypeSchemaRecord } from "../domain/content-type-schema";
import type { ContentTypeSchemaRepository } from "../domain/content-type-schema.repository";
import type { FolderRepository } from "../domain/folder.repository";
import { InMemoryContentTypeSchemaRepository } from "../infrastructure/in-memory-content-type-schema.repository";
import {
  loadContentTypeSchemaConfig,
  type ContentTypeSchemaConfig
} from "./content-type-schema.config";
import { CONTENT_TYPE_SCHEMA_REPOSITORY, FOLDER_REPOSITORY } from "./di-tokens";

export { CONTENT_TYPE_SCHEMA_REPOSITORY };
export const SCHEMA_PARSER = Symbol("SCHEMA_PARSER");
export const CONTENT_TYPE_SCHEMA_CONFIG = Symbol("CONTENT_TYPE_SCHEMA_CONFIG");

export const contentTypeSchemaProviders = [
  {
    provide: CONTENT_TYPE_SCHEMA_CONFIG,
    useFactory: (): ContentTypeSchemaConfig => loadContentTypeSchemaConfig()
  },
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
    useFactory: (config: ContentTypeSchemaConfig): SchemaParser =>
      new StrictYamlSchemaParser({ maxSourceBytes: config.maxYamlSourceBytes }),
    inject: [CONTENT_TYPE_SCHEMA_CONFIG]
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
  },
  {
    provide: ListContentTypeDefinitionsUseCase,
    useFactory: (repository: ContentTypeSchemaRepository): ListContentTypeDefinitionsUseCase =>
      new ListContentTypeDefinitionsUseCase(repository),
    inject: [CONTENT_TYPE_SCHEMA_REPOSITORY]
  },
  {
    provide: MoveContentTypeDefinitionUseCase,
    useFactory: (
      repository: ContentTypeSchemaRepository,
      folderRepository: FolderRepository
    ): MoveContentTypeDefinitionUseCase =>
      new MoveContentTypeDefinitionUseCase(repository, folderRepository),
    inject: [CONTENT_TYPE_SCHEMA_REPOSITORY, FOLDER_REPOSITORY]
  }
];
