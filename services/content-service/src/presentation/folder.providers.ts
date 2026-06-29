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
import {
  CryptoFolderIdGenerator,
  EmptyFolderContentReader,
  InMemoryFolderRepository
} from "../infrastructure/in-memory-folder.repository";

export const FOLDER_REPOSITORY = Symbol("FOLDER_REPOSITORY");
export const FOLDER_ID_GENERATOR = Symbol("FOLDER_ID_GENERATOR");
export const FOLDER_CONTENT_READER = Symbol("FOLDER_CONTENT_READER");

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
    provide: FOLDER_CONTENT_READER,
    useClass: EmptyFolderContentReader
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
  }
];
