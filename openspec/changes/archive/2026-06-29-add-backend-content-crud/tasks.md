## 1. Shared Contracts

- [x] 1.1 Add shared content ID, content type, schema version, draft status, record, create input, replace input, and patch input types in `@ecmp/shared-types`.
- [x] 1.2 Export the new content contracts from the shared types package public entry points.
- [x] 1.3 Add or update shared-types tests for content contract exports and expected literal/status typing.

## 2. Domain Model

- [x] 2.1 Add a content record domain model that creates draft records with `RCD-` IDs, version `1`, status `draft`, timestamps, and defensively copied data.
- [x] 2.2 Add domain behavior for replace and patch updates that increment version, refresh `updatedAt`, and preserve immutable content type identity.
- [x] 2.3 Add domain errors or result types for immutable content type conflicts and invalid content record operations following existing service patterns.
- [x] 2.4 Add domain tests for ID prefix, draft initialization, version increments, immutable content type behavior, timestamp updates, and defensive data copying.

## 3. Application Ports And Use Cases

- [x] 3.1 Add `ContentRepository` and `ContentIdGenerator` ports with list, list-by-folder, find, save or replace, delete, and `hasAssignedContent(folderId)` behavior.
- [x] 3.2 Implement `ListContentsUseCase` with optional `folderId` filtering.
- [x] 3.3 Implement `GetContentUseCase` with content-not-found behavior.
- [x] 3.4 Implement `CreateContentUseCase` with folder existence checks, schema resolution, content data validation, record creation, and persistence.
- [x] 3.5 Implement `ReplaceContentUseCase` with content lookup, folder checks, immutable content type checks, schema selection, validation, and versioned replacement.
- [x] 3.6 Implement `PatchContentUseCase` with content lookup, optional folder/schema changes, shallow data merge, immutable content type checks, validation, and versioned persistence.
- [x] 3.7 Implement `DeleteContentUseCase` with hard delete and content-not-found behavior.
- [x] 3.8 Add application tests for list, get, create, replace, patch, delete, folder-not-found, schema-not-found, invalid content data, hard delete, and folder occupancy behavior.

## 4. Infrastructure Wiring

- [x] 4.1 Implement UUID-backed `ContentIdGenerator` that produces `RCD-<uuid>` IDs.
- [x] 4.2 Implement in-memory content repository with defensive cloning and deterministic ordering by `createdAt`, then `contentId`.
- [x] 4.3 Add repository tests for list ordering, folder filtering, delete behavior, defensive cloning, and `hasAssignedContent`.
- [x] 4.4 Wire the content repository into the Content Service module and expose it through the needed ports.
- [x] 4.5 Wire folder deletion's `FolderContentReader` to the content repository occupancy check.
- [x] 4.6 Add or update folder deletion tests to prove folders with assigned content are rejected.

## 5. REST API

- [x] 5.1 Add management controller routes for `GET /api/management/contents` and optional `folderId` query filtering.
- [x] 5.2 Add management controller route for `GET /api/management/contents/:contentId`.
- [x] 5.3 Add management controller route for `POST /api/management/contents` returning `201`.
- [x] 5.4 Add management controller route for `PUT /api/management/contents/:contentId` returning `200`.
- [x] 5.5 Add management controller route for `PATCH /api/management/contents/:contentId` returning `200`.
- [x] 5.6 Add management controller route for `DELETE /api/management/contents/:contentId` returning `204`.
- [x] 5.7 Map malformed bodies and validation failures to `400`, missing content/folder/schema to `404`, and immutable content type conflicts to `409`.
- [x] 5.8 Add controller tests for all endpoints and status mappings: `201`, `200`, `204`, `400`, `404`, and `409`.

## 6. Verification

- [x] 6.1 Run `pnpm --filter @ecmp/shared-types test` and fix any failures.
- [x] 6.2 Run `pnpm --filter @ecmp/content-service test` and fix any failures.
- [x] 6.3 Run `pnpm typecheck` and fix any failures.
- [x] 6.4 Run `pnpm test` and fix any failures.
