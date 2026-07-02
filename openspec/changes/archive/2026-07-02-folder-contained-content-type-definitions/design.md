## Context

The platform currently separates folder/content/document ownership in `content-service` from content type schema ownership in `content-type-service`. Content validation in `content-service` depends on `HttpContentTypeSchemaReader`, and the API Gateway routes `/api/management/content-types` to the standalone Content Type Service.

The new requirement makes content type schemas administratively organized under `/system/schemas`. That turns content type definitions into repository objects: they have location, participate in folder occupancy, are browsed by admins, and affect repository navigation. Keeping those objects in a separate service would require distributed coordination for folder deletes, moves, validation, and setup seeding.

## Goals / Non-Goals

**Goals:**

- Make Content Service the runtime owner of content type schema records, schema version lifecycle, and schema lookup for content validation.
- Represent user content type definitions as folder-contained repository objects under `/system/schemas`.
- Seed reserved `/system` and `/system/schemas` folders and enforce protected-folder invariants.
- Allow admin-only schema folder administration and content type definition moves within `/system/schemas`.
- Preserve existing content type schema YAML parsing, validation, size limits, version replacement, active listing, explicit version reads, and soft deactivation semantics.
- Keep existing management API URLs stable where possible while changing their backend routing target to Content Service.

**Non-Goals:**

- Add durable MongoDB persistence for content type schemas or folders.
- Add schema hard-delete semantics; existing version deactivation remains soft delete.
- Expose `/system/schemas` as browsable CMIS content unless explicitly required by the specs for supported CMIS behavior.
- Redesign authentication/session infrastructure beyond enforcing admin-only schema administration boundaries already represented by roles/permissions.

## Decisions

### Merge schema runtime ownership into Content Service

Content Service will own schema repositories, schema use cases, schema controllers, and schema lookup used by content validation. The standalone Content Type Service will be removed from runtime composition, gateway routing, and local development service lists.

Alternatives considered:

- Keep Content Type Service separate and add cross-service folder coordination. Rejected because folder delete/move and schema occupancy would require synchronous calls or eventual consistency between services for a single repository invariant.
- Keep a separate schema-folder hierarchy inside Content Type Service. Rejected because `/system/schemas` is intended to be a real repository namespace, not a parallel UI-only tree.

### Model content type definitions as folder-contained objects grouped by content type name

The repository should treat a content type definition as the movable object. Versions remain lifecycle records under that definition. Admins move `article` between schema folders, not `article 1.0` independently from `article 2.0`.

The domain model should evolve from flat `ContentTypeSchemaRecord` entries keyed by `name:version` toward an aggregate similar to:

```text
ContentTypeDefinitionRecord
  contentTypeDefinitionId
  folderId
  name
  versions[]
```

The implementation may keep a repository optimized for `name + version` lookup, but externally observable behavior treats the definition as the folder-contained object.

Alternatives considered:

- Store each schema version as a separate folder child. Rejected because organization by version is less natural for administrators and complicates moves.
- Add only `folderId` to each existing schema version record. Acceptable as a transitional implementation detail, but the contract should describe the content type definition as the repository object.

### Reserve `/system` and `/system/schemas`

Setup will create the root folder plus `/system` and `/system/schemas`. Those folders cannot be renamed, moved, or deleted. Schema subfolders under `/system/schemas` may be created by admins and may be renamed, moved within `/system/schemas`, or deleted only when empty.

Normal content records and documents must not be created under `/system` or `/system/schemas`. These folders are administrative namespaces, not authoring destinations.

### Preserve API compatibility while changing routing

Existing content type schema URLs remain under `/api/management/content-types`. The API Gateway forwards those URLs to Content Service after the merge. New folder-aware administration can extend the same resource with `folderId` filters and move endpoints or use mixed folder children endpoints, but compatibility with active schema listing and schema version reads should remain.

### Keep admin administration separate from schema consumption

Creators still need to list active schemas and retrieve schemas to create content. Admin-only restrictions apply to schema administration, schema folder browsing, create/replace/deactivate/move, and protected namespace management. The design should avoid accidentally blocking content authoring workflows that consume active schemas.

## Risks / Trade-offs

- [Risk] Removing `content-type-service` can break scripts, Docker Compose, package filters, and gateway assumptions. -> Mitigation: update runtime wiring and tests in the same change and keep external gateway URLs stable.
- [Risk] Admin-only behavior is not fully represented in the current frontend route model. -> Mitigation: enforce restrictions in backend use cases/controllers first; frontend visibility is a usability layer.
- [Risk] Introducing a new repository object identity may ripple through shared types and CMIS helpers. -> Mitigation: add the smallest shared ID/type surface needed for content type definition objects and keep existing schema `name + version` APIs stable.
- [Risk] Path-based system folder checks can become brittle if more system namespaces are added. -> Mitigation: centralize reserved folder definitions and protected namespace checks in folder domain/application code.
- [Risk] CMIS clients may infer `/system/schemas` should be browsable. -> Mitigation: specs must explicitly state whether CMIS exposes or hides schema definition objects for this slice.

## Migration Plan

1. Move content type schema domain/application/infrastructure/controller wiring into Content Service while preserving tests and behavior.
2. Change Content Service schema reader wiring from HTTP to the local schema repository.
3. Update API Gateway routing so `/api/management/content-types` targets Content Service.
4. Remove standalone Content Type Service runtime wiring from package scripts, Docker Compose, and backend test groups after Content Service owns equivalent behavior.
5. Add reserved system folder seeding and protected-folder rules.
6. Add folder-contained content type definition behavior, schema folder administration, schema move behavior, and folder occupancy checks.
7. Update the management frontend schema administration workspace to browse `/system/schemas`.

Rollback is primarily a code rollback while persistence remains in-memory. If durable persistence is added later, this change will need a data migration and rollback plan for schema object locations.

## Resolved Questions

- **Content type definition ID prefix.** Resolved to add the `CTD-` global ID prefix (`ContentTypeDefinitionId`) for content type definition objects. Definitions remain looked up by name/version internally, but the folder-contained object carries a stable `CTD-` identifier surfaced through the administration API.
- **CMIS exposure of `/system/schemas`.** Resolved to hide the schema administration namespace from CMIS navigation for this slice: folder children omit system-namespace folders, and object-by-id / object-by-path for `/system/schemas` return CMIS not-found. CMIS type discovery still lists active user content types.
- **Schema subfolder moves.** Resolved to allow moving a schema subfolder to any valid parent under `/system/schemas` (not only direct children), while rejecting moves that would take it outside the schema namespace or into its own descendants.
- **Reserved folder identities.** Resolved to reserve `FLD-system` (`/system`) and `FLD-system-schemas` (`/system/schemas`), seeded alongside `FLD-root`.
- **Admin authorization plumbing.** Resolved to reuse the existing `x-ecmp-permissions` header convention (as CMIS already does): schema administration requires the `content-type:<action>` permission; an absent header skips enforcement to preserve no-auth development flows.
- **New API surface.** Content type definitions are listed via `GET /api/management/content-types/definitions?folderId=`, moved via `POST /api/management/content-types/{name}/move`, and folders are moved via `POST /api/management/folders/{id}/move`. Schema create accepts an optional `folderId`.
