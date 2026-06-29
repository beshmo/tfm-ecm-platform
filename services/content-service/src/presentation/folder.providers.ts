import {
  CreateContentUseCase,
  DeleteContentUseCase,
  GetContentUseCase,
  ListContentsUseCase,
  PatchContentUseCase,
  ReplaceContentUseCase
} from "../application/content.use-cases";
import type { ContentIdGenerator } from "../domain/content-id-generator";
import type { ContentRepository } from "../domain/content.repository";
import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  GetFolderUseCase,
  ListFoldersUseCase,
  RenameFolderUseCase
} from "../application/folder.use-cases";
import type { FolderContentReader } from "../domain/folder-content.reader";
import type { FolderIdGenerator } from "../domain/folder-id-generator";
import type { FolderRepository } from "../domain/folder.repository";
import { InMemoryContentTypeSchemaReader } from "../infrastructure/in-memory-content-type-schema.reader";
import {
  CryptoContentIdGenerator,
  InMemoryContentRepository
} from "../infrastructure/in-memory-content.repository";
import {
  CryptoFolderIdGenerator,
  InMemoryFolderRepository
} from "../infrastructure/in-memory-folder.repository";

export const FOLDER_REPOSITORY = Symbol("FOLDER_REPOSITORY");
export const FOLDER_ID_GENERATOR = Symbol("FOLDER_ID_GENERATOR");
export const FOLDER_CONTENT_READER = Symbol("FOLDER_CONTENT_READER");
export const CONTENT_REPOSITORY = Symbol("CONTENT_REPOSITORY");
export const CONTENT_ID_GENERATOR = Symbol("CONTENT_ID_GENERATOR");
export const CONTENT_TYPE_SCHEMA_READER = Symbol("CONTENT_TYPE_SCHEMA_READER");

export const folderProviders = [
  {
    provide: FOLDER_REPOSITORY,
    useFactory: (): FolderRepository => new InMemoryFolderRepository()
  },
  {
    provide: FOLDER_ID_GENERATOR,
    useClass: CryptoFolderIdGenerator
  },
  {
    provide: CONTENT_REPOSITORY,
    useFactory: (): ContentRepository => new InMemoryContentRepository()
  },
  {
    provide: CONTENT_ID_GENERATOR,
    useClass: CryptoContentIdGenerator
  },
  {
    provide: CONTENT_TYPE_SCHEMA_READER,
    useFactory: (): ContentTypeSchemaReader => new InMemoryContentTypeSchemaReader()
  },
  {
    provide: FOLDER_CONTENT_READER,
    useExisting: CONTENT_REPOSITORY
  },
  {
    provide: ListFoldersUseCase,
    useFactory: (repository: FolderRepository): ListFoldersUseCase =>
      new ListFoldersUseCase(repository),
    inject: [FOLDER_REPOSITORY]
  },
  {
    provide: GetFolderUseCase,
    useFactory: (repository: FolderRepository): GetFolderUseCase =>
      new GetFolderUseCase(repository),
    inject: [FOLDER_REPOSITORY]
  },
  {
    provide: CreateFolderUseCase,
    useFactory: (
      repository: FolderRepository,
      idGenerator: FolderIdGenerator
    ): CreateFolderUseCase => new CreateFolderUseCase(repository, idGenerator),
    inject: [FOLDER_REPOSITORY, FOLDER_ID_GENERATOR]
  },
  {
    provide: RenameFolderUseCase,
    useFactory: (repository: FolderRepository): RenameFolderUseCase =>
      new RenameFolderUseCase(repository),
    inject: [FOLDER_REPOSITORY]
  },
  {
    provide: DeleteFolderUseCase,
    useFactory: (
      repository: FolderRepository,
      contentReader: FolderContentReader
    ): DeleteFolderUseCase => new DeleteFolderUseCase(repository, contentReader),
    inject: [FOLDER_REPOSITORY, FOLDER_CONTENT_READER]
  },
  {
    provide: ListContentsUseCase,
    useFactory: (repository: ContentRepository): ListContentsUseCase =>
      new ListContentsUseCase(repository),
    inject: [CONTENT_REPOSITORY]
  },
  {
    provide: GetContentUseCase,
    useFactory: (repository: ContentRepository): GetContentUseCase =>
      new GetContentUseCase(repository),
    inject: [CONTENT_REPOSITORY]
  },
  {
    provide: CreateContentUseCase,
    useFactory: (
      repository: ContentRepository,
      folderRepository: FolderRepository,
      schemaReader: ContentTypeSchemaReader,
      idGenerator: ContentIdGenerator
    ): CreateContentUseCase =>
      new CreateContentUseCase(repository, folderRepository, schemaReader, idGenerator),
    inject: [CONTENT_REPOSITORY, FOLDER_REPOSITORY, CONTENT_TYPE_SCHEMA_READER, CONTENT_ID_GENERATOR]
  },
  {
    provide: ReplaceContentUseCase,
    useFactory: (
      repository: ContentRepository,
      folderRepository: FolderRepository,
      schemaReader: ContentTypeSchemaReader
    ): ReplaceContentUseCase =>
      new ReplaceContentUseCase(repository, folderRepository, schemaReader),
    inject: [CONTENT_REPOSITORY, FOLDER_REPOSITORY, CONTENT_TYPE_SCHEMA_READER]
  },
  {
    provide: PatchContentUseCase,
    useFactory: (
      repository: ContentRepository,
      folderRepository: FolderRepository,
      schemaReader: ContentTypeSchemaReader
    ): PatchContentUseCase => new PatchContentUseCase(repository, folderRepository, schemaReader),
    inject: [CONTENT_REPOSITORY, FOLDER_REPOSITORY, CONTENT_TYPE_SCHEMA_READER]
  },
  {
    provide: DeleteContentUseCase,
    useFactory: (repository: ContentRepository): DeleteContentUseCase =>
      new DeleteContentUseCase(repository),
    inject: [CONTENT_REPOSITORY]
  }
];
