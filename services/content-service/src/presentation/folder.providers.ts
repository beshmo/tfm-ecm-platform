import {
  CreateContentUseCase,
  DeleteContentUseCase,
  GetContentUseCase,
  ListContentsUseCase,
  PatchContentUseCase,
  ReplaceContentUseCase
} from "../application/content.use-cases";
import {
  DeleteStaticFileUseCase,
  GetStaticFileUseCase,
  ListStaticFilesUseCase,
  RenameStaticFileUseCase,
  UploadStaticFileUseCase
} from "../application/static-file.use-cases";
import type { ContentIdGenerator } from "../domain/content-id-generator";
import type { ContentRepository } from "../domain/content.repository";
import type { ContentTypeSchemaReader } from "../domain/content-type-schema.reader";
import {
  CreateFolderUseCase,
  DeleteFolderUseCase,
  GetFolderUseCase,
  ListFoldersUseCase,
  MoveFolderUseCase,
  RenameFolderUseCase
} from "../application/folder.use-cases";
import { createRootFolder } from "../domain/folder";
import {
  createSystemFolder,
  createSystemSchemasFolder
} from "../domain/system-folder";
import type { FolderContentReader } from "../domain/folder-content.reader";
import type { FolderIdGenerator } from "../domain/folder-id-generator";
import type { FolderRepository } from "../domain/folder.repository";
import type { StaticFileIdGenerator } from "../domain/static-file-id-generator";
import type { StaticFileRepository } from "../domain/static-file.repository";
import type { StaticFileStorage } from "../domain/static-file.storage";
import type { ContentTypeSchemaRepository } from "../domain/content-type-schema.repository";
import { CompositeFolderContentReader } from "../infrastructure/composite-folder-content.reader";
import { FilesystemStaticFileStorage } from "../infrastructure/filesystem-static-file.storage";
import { SchemaRepositoryContentTypeSchemaReader } from "../infrastructure/schema-repository-content-type-schema.reader";
import {
  CryptoContentIdGenerator,
  InMemoryContentRepository
} from "../infrastructure/in-memory-content.repository";
import {
  CryptoFolderIdGenerator,
  InMemoryFolderRepository
} from "../infrastructure/in-memory-folder.repository";
import {
  CryptoStaticFileIdGenerator,
  InMemoryStaticFileRepository
} from "../infrastructure/in-memory-static-file.repository";
import { CONTENT_TYPE_SCHEMA_REPOSITORY, FOLDER_REPOSITORY } from "./di-tokens";

export { FOLDER_REPOSITORY };
export const FOLDER_ID_GENERATOR = Symbol("FOLDER_ID_GENERATOR");
export const FOLDER_CONTENT_READER = Symbol("FOLDER_CONTENT_READER");
export const CONTENT_REPOSITORY = Symbol("CONTENT_REPOSITORY");
export const CONTENT_ID_GENERATOR = Symbol("CONTENT_ID_GENERATOR");
export const CONTENT_TYPE_SCHEMA_READER = Symbol("CONTENT_TYPE_SCHEMA_READER");
export const STATIC_FILE_REPOSITORY = Symbol("STATIC_FILE_REPOSITORY");
export const STATIC_FILE_ID_GENERATOR = Symbol("STATIC_FILE_ID_GENERATOR");
export const STATIC_FILE_STORAGE = Symbol("STATIC_FILE_STORAGE");

export const folderProviders = [
  {
    provide: FOLDER_REPOSITORY,
    useFactory: (): FolderRepository =>
      new InMemoryFolderRepository([
        createRootFolder(),
        createSystemFolder(),
        createSystemSchemasFolder()
      ])
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
    provide: STATIC_FILE_REPOSITORY,
    useFactory: (): StaticFileRepository => new InMemoryStaticFileRepository()
  },
  {
    provide: STATIC_FILE_ID_GENERATOR,
    useClass: CryptoStaticFileIdGenerator
  },
  {
    provide: STATIC_FILE_STORAGE,
    useClass: FilesystemStaticFileStorage
  },
  {
    provide: CONTENT_TYPE_SCHEMA_READER,
    useFactory: (repository: ContentTypeSchemaRepository): ContentTypeSchemaReader =>
      new SchemaRepositoryContentTypeSchemaReader(repository),
    inject: [CONTENT_TYPE_SCHEMA_REPOSITORY]
  },
  {
    provide: FOLDER_CONTENT_READER,
    useFactory: (
      contentReader: FolderContentReader,
      staticFileRepository: StaticFileRepository,
      schemaRepository: ContentTypeSchemaRepository
    ): FolderContentReader =>
      new CompositeFolderContentReader(
        contentReader,
        staticFileRepository,
        schemaRepository
      ),
    inject: [CONTENT_REPOSITORY, STATIC_FILE_REPOSITORY, CONTENT_TYPE_SCHEMA_REPOSITORY]
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
    provide: MoveFolderUseCase,
    useFactory: (repository: FolderRepository): MoveFolderUseCase =>
      new MoveFolderUseCase(repository),
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
  },
  {
    provide: ListStaticFilesUseCase,
    useFactory: (repository: StaticFileRepository): ListStaticFilesUseCase =>
      new ListStaticFilesUseCase(repository),
    inject: [STATIC_FILE_REPOSITORY]
  },
  {
    provide: GetStaticFileUseCase,
    useFactory: (repository: StaticFileRepository): GetStaticFileUseCase =>
      new GetStaticFileUseCase(repository),
    inject: [STATIC_FILE_REPOSITORY]
  },
  {
    provide: UploadStaticFileUseCase,
    useFactory: (
      repository: StaticFileRepository,
      folderRepository: FolderRepository,
      storage: StaticFileStorage,
      idGenerator: StaticFileIdGenerator
    ): UploadStaticFileUseCase =>
      new UploadStaticFileUseCase(repository, folderRepository, storage, idGenerator),
    inject: [
      STATIC_FILE_REPOSITORY,
      FOLDER_REPOSITORY,
      STATIC_FILE_STORAGE,
      STATIC_FILE_ID_GENERATOR
    ]
  },
  {
    provide: RenameStaticFileUseCase,
    useFactory: (repository: StaticFileRepository): RenameStaticFileUseCase =>
      new RenameStaticFileUseCase(repository),
    inject: [STATIC_FILE_REPOSITORY]
  },
  {
    provide: DeleteStaticFileUseCase,
    useFactory: (
      repository: StaticFileRepository,
      storage: StaticFileStorage
    ): DeleteStaticFileUseCase => new DeleteStaticFileUseCase(repository, storage),
    inject: [STATIC_FILE_REPOSITORY, STATIC_FILE_STORAGE]
  }
];
