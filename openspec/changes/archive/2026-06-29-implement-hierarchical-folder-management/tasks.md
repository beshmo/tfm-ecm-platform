## 1. Shared Contracts

- [x] 1.1 Add shared folder types in `packages/shared-types/src`: `Folder`, `FolderCreateInput`, `FolderUpdateInput`, and any folder error code/result types needed by tests.
- [x] 1.2 Add shared type tests covering `FLD-root`, nullable `parentFolderId`, and folder create/update input shapes.

## 2. Domain Model And Rules

- [x] 2.1 Add folder domain tests for root folder invariants, `FLD-` ID expectations, path derivation from parent path and name, and descendant path recalculation.
- [x] 2.2 Add folder domain tests for valid name trimming and invalid names: empty, `.`, `..`, `/`, `\`, control characters, `<`, `>`, `:`, `"`, `|`, `?`, and `*`.
- [x] 2.3 Implement folder domain helpers/entities for root folder creation, name normalization/validation, path building, folder creation, rename metadata updates, and descendant path updates.

## 3. Ports And In-Memory Infrastructure

- [x] 3.1 Add `FolderRepository`, `FolderIdGenerator`, and `FolderContentReader` ports with methods needed by list/get/create/rename/delete use cases.
- [x] 3.2 Add tests for `InMemoryFolderRepository` covering root seeding, defensive cloning, save/find/list, child lookup, sibling lookup, delete, and descendant path updates.
- [x] 3.3 Implement `InMemoryFolderRepository`, crypto-backed `FolderIdGenerator`, and empty in-memory `FolderContentReader`.

## 4. Application Use Cases

- [x] 4.1 Add application error classes for folder not found, parent folder not found, invalid folder name, duplicate sibling name, root operation conflicts, and non-empty folder conflicts.
- [x] 4.2 Add use case tests for listing all folders, listing direct children, retrieving folders, creating root children, creating nested children, and missing parent rejection.
- [x] 4.3 Add use case tests for rename success, root rename rejection, duplicate sibling rename rejection, and descendant path updates.
- [x] 4.4 Add use case tests for delete success, root delete rejection, child-folder rejection, assigned-content rejection, and missing folder rejection.
- [x] 4.5 Implement `ListFoldersUseCase`, `GetFolderUseCase`, `CreateFolderUseCase`, `RenameFolderUseCase`, and `DeleteFolderUseCase`.

## 5. REST Presentation

- [x] 5.1 Add `FoldersController` tests with Supertest for `GET /api/management/folders`, `GET /api/management/folders/:folderId`, `POST /api/management/folders`, `PATCH /api/management/folders/:folderId`, and `DELETE /api/management/folders/:folderId`.
- [x] 5.2 Add controller tests for malformed DTOs, invalid names, missing folders, missing parents, duplicate sibling conflicts, root operation conflicts, and non-empty folder conflicts.
- [x] 5.3 Implement manual DTO validation, response mapping, error-to-status mapping, and wire `FoldersController` into `AppModule` with singleton in-memory dependencies.

## 6. Verification

- [x] 6.1 Run `pnpm --filter @ecmp/shared-types test`.
- [x] 6.2 Run `pnpm --filter @ecmp/content-service test`.
- [x] 6.3 Run `pnpm typecheck`.
- [x] 6.4 Run `pnpm test`.
