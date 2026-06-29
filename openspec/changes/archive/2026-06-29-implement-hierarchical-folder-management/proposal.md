## Why

Phase 3 needs folder hierarchy behavior before content CRUD can reliably assign records to folders. Implementing the backend folder-management slice now creates the Content Service contract for organizing content while keeping the first implementation small and testable.

## What Changes

- Add shared folder contracts for folder records and create/update inputs.
- Add Content Service domain rules for the reserved root folder, `FLD-` IDs, filesystem-like folder names, materialized paths, and sibling name uniqueness.
- Add application use cases for listing, retrieving, creating, renaming, and deleting folders.
- Add an in-memory folder repository seeded with `FLD-root`, plus ports that allow later MongoDB replacement.
- Add REST endpoints under `/api/management/folders`.
- Reject root rename/delete, duplicate sibling names, invalid folder names, missing parents, and deletion of folders that are not empty.
- Defer Angular folder explorer integration, MongoDB persistence, API Gateway authorization enforcement, and content CRUD integration beyond the empty-folder deletion port.

## Capabilities

### New Capabilities

- `hierarchical-folder-management`: Content authors can manage a backend folder hierarchy with reserved root semantics, validated folder names, materialized paths, and REST APIs.

### Modified Capabilities

- None.

## Impact

- Affected code: `packages/shared-types/src` and `services/content-service/src`.
- Affected APIs: new Content Service management endpoints under `/api/management/folders`.
- Affected tests: shared type tests, Content Service domain/application/infrastructure tests, and Content Service controller/API tests.
- Dependencies: no new runtime dependencies; use Node `crypto.randomUUID()` for generated folder IDs.
- Persistence: in-memory only for this slice, behind repository ports for a later MongoDB adapter.
