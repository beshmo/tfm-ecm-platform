## Why

Phase 3 needs static file upload and metadata management so authors can manage binary assets alongside draft content in the folder explorer. The current content and folder CRUD scaffold provides the necessary authoring surface, but static files are not yet represented by shared contracts, Content Service use cases, gateway routes, or frontend workflows.

## What Changes

- Add shared static file contracts for `STF-` identifiers, folder-scoped metadata responses, update inputs, and normalized error codes.
- Add Content Service static file domain and application behavior for upload/create, list-by-folder, retrieve, rename metadata, and delete.
- Store static file metadata through an in-memory repository and uploaded binaries through filesystem-backed storage behind ports.
- Expose management REST endpoints under `/api/management/files`, including multipart upload with explicit Multer limits and MIME allowlisting.
- Route `/api/management/files*` requests through the API Gateway, preserving multipart upload bodies instead of forcing JSON forwarding.
- Extend the Management Frontend folder explorer to load files for the selected folder and support upload, rename, delete, empty, loading, and error states.
- Treat assigned static files as folder occupancy so non-empty folder deletion is rejected consistently with assigned content records.
- Update architecture documentation that previously showed `contentId` on file metadata so Phase 3 files are folder-scoped.
- Keep MongoDB metadata persistence, file download or preview, file versioning, virus scanning, object storage, and publication or delivery projection out of scope.

## Capabilities

### New Capabilities

- `static-file-management`: Static file shared contracts, Content Service upload and metadata CRUD behavior, filesystem-backed binary storage, management REST endpoints, and API Gateway routing.

### Modified Capabilities

- `management-content-authoring`: The folder explorer loads and manages static files alongside content records for the selected folder.
- `hierarchical-folder-management`: Folder deletion rejects folders with assigned static files as non-empty folders.

## Impact

- Affects `@ecmp/shared-types` by adding static file metadata contracts and error code types.
- Affects `content-service` domain, application, infrastructure, and presentation layers.
- Affects `api-gateway` forwarding behavior for the new files route family and multipart requests.
- Affects `apps/management-frontend/src` by adding a file API client and folder explorer file management UI.
- Adds local filesystem storage rooted by `STATIC_FILE_STORAGE_ROOT` with a development default.
- Adds tests for shared contracts, backend use cases and controllers, gateway routing, frontend API/client behavior, and folder occupancy.
