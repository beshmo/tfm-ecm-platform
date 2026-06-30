## 1. Shared Contracts

- [x] 1.1 Add `StaticFileId`, `StaticFile`, `StaticFileUpdateInput`, and `StaticFileErrorCode` to `@ecmp/shared-types`.
- [x] 1.2 Ensure `StaticFileId` uses the `STF-` global ID prefix and existing ID prefix exports remain backward compatible.
- [x] 1.3 Add shared-types tests for static file ID typing, metadata response shape, update input shape, and file error codes.

## 2. Backend Domain And Application

- [x] 2.1 Add a static file domain model that creates folder-scoped metadata with `STF-` IDs, validated filenames, MIME type, size, internal path, and timestamps.
- [x] 2.2 Add domain behavior for renaming static file metadata while preserving binary path, MIME type, size, folder assignment, and creation timestamp.
- [x] 2.3 Add static file application errors for not found, missing folder, invalid filename, missing upload, unsupported MIME type, oversized upload, and storage failure.
- [x] 2.4 Add `StaticFileRepository`, `StaticFileStorage`, and `StaticFileIdGenerator` ports.
- [x] 2.5 Implement use cases for list-by-folder, get, upload/create, rename metadata, and delete with storage cleanup.
- [x] 2.6 Validate folder existence through the existing folder repository before creating static file metadata.
- [x] 2.7 Add backend application tests for successful upload, list, get, rename, delete, invalid folder, invalid filename, missing upload, unsupported MIME type, oversized upload, missing file, and storage cleanup failure.

## 3. Backend Infrastructure And Wiring

- [x] 3.1 Implement UUID-backed static file ID generation producing `STF-<uuid>` IDs.
- [x] 3.2 Implement an in-memory static file repository with defensive cloning, deterministic ordering by `createdAt` then `fileId`, and folder occupancy reporting.
- [x] 3.3 Implement filesystem-backed static file storage rooted at `STATIC_FILE_STORAGE_ROOT` with a safe local development default.
- [x] 3.4 Generate internal storage paths from static file IDs rather than trusting client-supplied paths.
- [x] 3.5 Wire static file repository, storage, ID generator, and use cases into the Content Service providers.
- [x] 3.6 Update folder deletion occupancy wiring so assigned content records or assigned static files make a folder non-empty.
- [x] 3.7 Add infrastructure and folder deletion tests for repository cloning, ordering, file occupancy, and non-empty folder rejection.

## 4. Content Service REST API

- [x] 4.1 Add `GET /api/management/files?folderId={folderId}` for listing selected-folder static files.
- [x] 4.2 Add `GET /api/management/files/{fileId}` for retrieving static file metadata.
- [x] 4.3 Add `POST /api/management/files` multipart upload with fields `folderId` and `file`.
- [x] 4.4 Configure upload limits for one file, one metadata field, 10 MiB file size, and bounded field nesting depth.
- [x] 4.5 Enforce the MIME allowlist: `application/pdf`, `text/plain`, `image/jpeg`, `image/png`, `image/gif`, and `image/webp`.
- [x] 4.6 Add `PATCH /api/management/files/{fileId}` for updating `filename`.
- [x] 4.7 Add `DELETE /api/management/files/{fileId}` returning `204` after metadata and binary cleanup.
- [x] 4.8 Map malformed input to `400`, missing resources to `404`, oversized upload to `413`, unsupported MIME type to `415`, and storage failure to a safe `500`.
- [x] 4.9 Add controller tests for all file endpoints and status mappings.

## 5. API Gateway

- [x] 5.1 Route `/api/management/files*` requests to the Content Service.
- [x] 5.2 Preserve method, path, query string, status code, and response body for file metadata JSON requests.
- [x] 5.3 Add multipart-aware forwarding for `POST /api/management/files` that preserves the incoming multipart content type and request body.
- [x] 5.4 Ensure existing folder, content, and content-type gateway routes still forward JSON requests correctly.
- [x] 5.5 Add gateway tests for file metadata reads, file metadata mutations, multipart upload forwarding, preserved file API errors, and unavailable Content Service behavior.

## 6. Frontend File Management

- [x] 6.1 Add an Angular `StaticFileApiClient` for listing by folder, uploading with `FormData`, renaming, and deleting files through relative gateway URLs.
- [x] 6.2 Ensure upload requests do not manually set the `content-type` header.
- [x] 6.3 Update folder explorer state loading so selecting a folder loads both content records and static files.
- [x] 6.4 Render selected-folder static files with filename, MIME type, size, updated timestamp, and actions.
- [x] 6.5 Add upload UI for the selected folder and refresh the file list after successful upload.
- [x] 6.6 Add rename UI for static file metadata and refresh or update the file list after success.
- [x] 6.7 Add delete confirmation for static files and remove files from the selected folder list after a successful `204`.
- [x] 6.8 Add inline loading, empty, validation, unsupported media type, oversized upload, not-found, and generic error states for file workflows.
- [x] 6.9 Add frontend API client and folder explorer component tests for file loading, upload, rename, delete, empty state, and error display.

## 7. Documentation And Verification

- [x] 7.1 Update `docs/architecture.md` file metadata examples to use `folderId` instead of `contentId` for this Phase 3 slice.
- [x] 7.2 Document `STATIC_FILE_STORAGE_ROOT`, the local development default, and the fact that metadata is in-memory while binaries are filesystem-backed.
- [x] 7.3 Run `pnpm typecheck` and fix failures.
- [x] 7.4 Run `pnpm lint` and fix failures.
- [x] 7.5 Run `pnpm test` and fix failures.
- [x] 7.6 Run `pnpm build` and fix failures.
- [x] 7.7 Run `openspec validate --changes add-file-metadata-management` and fix validation issues.
