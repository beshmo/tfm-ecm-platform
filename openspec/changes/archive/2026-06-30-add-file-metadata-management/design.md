## Context

The repository is in Phase 3. Folder management, content record CRUD, API Gateway forwarding for JSON management APIs, and the Angular folder explorer already exist. Static files are described in the architecture as a Content Service responsibility, but there are no shared contracts, domain rules, upload endpoints, storage ports, gateway routes, or frontend workflows for files yet.

This change is the first static file slice. It keeps metadata persistence aligned with the current in-memory scaffold while adding real filesystem-backed binary storage through a port. The design also applies the security follow-up from the Multer mitigation report by setting explicit multipart limits and validating metadata before accepting uploads.

## Goals / Non-Goals

**Goals:**

- Represent static files as folder-scoped authoring resources with `STF-` IDs.
- Upload one binary file plus `folderId` metadata through the Content Service.
- Store file metadata in memory and binary content on filesystem-backed local storage.
- List, retrieve, rename, and delete static file metadata through management APIs.
- Route file management APIs through the API Gateway, including multipart upload.
- Extend the folder explorer to show and manage files in the selected folder.
- Reject folder deletion when assigned static files exist.

**Non-Goals:**

- MongoDB metadata persistence.
- Public file download, preview, or streaming APIs.
- Object storage, antivirus scanning, deduplication, file versioning, or lifecycle archival.
- Publication or delivery projection of static files.
- New authentication or RBAC enforcement beyond the existing documented permission model.

## Decisions

1. Static files are folder-scoped for this slice.

   File metadata will include `folderId` rather than `contentId`. This matches the folder explorer workflow, lets authors manage files beside content records, and keeps content attachment semantics out of the first implementation. Content-attached files were considered because the architecture example currently shows `contentId`, but that would force content relationship rules before the UI needs them. Supporting both was rejected for now because it creates nullable ownership and deletion semantics too early.

2. Use ports for metadata and binary storage.

   The Content Service will introduce `StaticFileRepository` for metadata and `StaticFileStorage` for binary writes/deletes. Use cases depend on those ports, not on filesystem or in-memory classes. The first repository implementation is in-memory with defensive cloning and deterministic ordering by `createdAt`, then `fileId`. The first storage implementation writes files under `STATIC_FILE_STORAGE_ROOT`, defaulting to a local development path under the workspace or service runtime directory.

3. Store generated storage names, not trusted client paths.

   The uploaded original filename is metadata only after validation and normalization. Filesystem storage paths are generated from the `STF-` ID plus a safe extension derived from the validated filename or MIME type. The returned `path` is internal metadata and must not be treated as a public URL.

4. Validate before metadata persistence.

   Upload/create validates folder existence, file presence, filename shape, MIME type allowlist, and size limits before saving metadata. If binary storage succeeds but metadata persistence fails, the use case attempts best-effort binary cleanup before rethrowing. Delete removes metadata only after the file exists in the repository and invokes storage cleanup; cleanup failures surface as request failures so the record does not silently point at missing or orphaned binary state.

5. Use NestJS multipart handling only at the Content Service boundary.

   The Content Service file controller will accept `multipart/form-data` for `POST /api/management/files` with one field named `folderId` and one file field named `file`. Multer limits must include `files: 1`, `fields: 1`, `fileSize: 10 * 1024 * 1024`, and bounded `fieldNestingDepth`. Supported MIME types are `application/pdf`, `text/plain`, `image/jpeg`, `image/png`, `image/gif`, and `image/webp`.

6. Make API Gateway forwarding content-type aware.

   Existing gateway forwarding serializes request bodies as JSON and sets `content-type: application/json`. File uploads require a separate forwarding path that preserves the incoming multipart content type and body stream for `/api/management/files` `POST` requests. JSON file metadata requests can continue through the JSON forwarding behavior. Direct frontend-to-service upload was considered, but it would bypass the gateway contract used by the Management Frontend.

7. Keep frontend state local and predictable.

   Add a `StaticFileApiClient` that uses relative `/api/management/files` URLs. Upload uses `FormData` and does not manually set `content-type`, allowing the browser to set the multipart boundary. The folder explorer loads content records and static files for the selected folder, presents them in separate sections or a clearly typed combined list, and keeps upload/rename/delete errors inline.

## Risks / Trade-offs

- Filesystem storage can leave orphaned files if metadata persistence fails -> Use best-effort cleanup on failure and cover the behavior with use case tests.
- In-memory metadata is lost on restart while binaries remain on disk -> Accept for the scaffold, document it, and keep repository/storage ports ready for MongoDB reconciliation later.
- Multipart forwarding is more complex than JSON proxying -> Add gateway tests that prove multipart uploads preserve headers/body and JSON metadata requests still work.
- MIME type validation based on client metadata is incomplete -> Treat allowlisting as first-pass hardening and keep antivirus/content sniffing out of scope for this slice.
- Folder deletion now depends on both content and file occupancy -> Introduce a folder occupancy port/composition or extend the existing occupancy reader wiring without coupling folder domain rules to file repository implementation details.

## Migration Plan

- Add the OpenSpec requirements first, then implement shared contracts, backend behavior, gateway routing, frontend integration, and documentation in that order.
- No database migration is required because metadata persistence remains in memory.
- Existing content and folder APIs remain backward compatible.
- Rollback can remove the new file routes and frontend file UI without changing existing content records or folders; local uploaded files may be manually removed from the configured storage root in development.

## Open Questions

- None for the first implementation slice. Future changes should decide download/preview APIs, MongoDB metadata persistence, object storage, antivirus scanning, and whether files can later attach to content records.
