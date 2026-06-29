## Context

The Content Service currently has content validation domain/application code and a health endpoint, but no folder model, persistence port, or management API. Architecture docs and ADR-0011 already define folders as the Content Service source of truth, with `FLD-` identifiers, reserved root folder `FLD-root`, materialized paths, and filesystem-like validation.

This change implements the first backend-only folder slice for Phase 3. It deliberately uses in-memory persistence so folder behavior and REST contracts can be proven before introducing MongoDB.

## Goals / Non-Goals

**Goals:**

- Provide shared TypeScript contracts for folders and folder create/update inputs.
- Implement framework-free domain rules for root folder invariants, folder names, path derivation, and path updates.
- Implement use cases for listing, retrieving, creating, renaming, and deleting folders.
- Expose Content Service REST endpoints under `/api/management/folders`.
- Keep repository, ID generation, and content-occupancy checks behind ports so MongoDB and content CRUD can be added later.
- Add unit and API tests covering success cases and expected business errors.

**Non-Goals:**

- Do not add Angular folder explorer integration.
- Do not add MongoDB persistence, migrations, or indexes.
- Do not implement content CRUD, static file management, or folder content listing.
- Do not implement JWT or permission enforcement in this service slice.
- Do not add `class-validator` or other DTO validation dependencies.

## Decisions

1. Use in-memory persistence behind repository ports.

   `InMemoryFolderRepository` will seed `FLD-root`, clone records on read/write, support sibling and child lookups, and update descendant paths during rename. This matches the current scaffold style while preserving a clean seam for a future MongoDB adapter. MongoDB is deferred because the selected first slice prioritizes behavior and contract tests over production storage.

2. Keep folder rules in the Content Service domain layer.

   Domain helpers will own root creation, folder-name normalization/validation, path joining, and descendant path recalculation. Controllers and repositories must not duplicate those rules. This keeps filesystem-like constraints testable without NestJS or persistence.

3. Model deletion as empty-folder deletion only.

   `DeleteFolderUseCase` will reject root deletion, folders with child folders, and folders reported as having content. A `FolderContentReader` port will initially use an empty in-memory implementation so the rule exists before content records are implemented. Archive and cascade behavior are deferred because they require broader lifecycle and audit decisions.

4. Return business errors through typed application errors and HTTP mapping.

   Use cases will throw explicit errors such as folder not found, parent not found, invalid name, duplicate sibling name, root operation not allowed, and non-empty folder. The controller maps malformed DTOs or invalid names to `400`, missing folders to `404`, and business conflicts to `409`.

5. Keep API shape aligned with the architecture document.

   Folder responses expose `folderId`, `name`, `parentFolderId`, `path`, `createdAt`, and `updatedAt`. Create requests accept `name` and `parentFolderId`; update requests accept only `name`. `GET /api/management/folders` accepts optional `parentFolderId` and otherwise returns the full tree as a flat sorted list.

## Risks / Trade-offs

- In-memory data resets on process restart -> Accept for this slice and keep persistence isolated behind `FolderRepository`.
- Case-insensitive sibling uniqueness may differ from future database collation -> Add repository-level tests now and mirror the same comparison in future MongoDB indexes/queries.
- Renaming folders with many descendants can be expensive -> Accept for in-memory and initial scale; future MongoDB implementation can update descendants by path prefix.
- Permission checks are not enforced yet -> Keep documented endpoint permissions unchanged and defer enforcement to the API Gateway/security slice.

## Migration Plan

No data migration is required. Deploying this slice adds source code and tests only. Rollback is a source/test revert. A later MongoDB change will introduce storage migration and index decisions.

## Open Questions

- Should folder deletion eventually archive folders and contained content instead of rejecting non-empty folders?
- Should future folder names support locale-specific normalization beyond case-insensitive sibling comparison?
