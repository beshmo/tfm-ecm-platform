## Context

The Content Service already has backend slices for hierarchical folders, content type schemas, and content instance validation. Those slices provide folder existence checks, schema lookup, and `validateContentInstanceData`, but content records themselves are not yet persisted or exposed through management APIs.

This change adds the backend-only content CRUD slice for Phase 3. It must fit the existing clean architecture boundaries, use in-memory persistence for now, and leave Angular UI, API Gateway authorization enforcement, MongoDB persistence, publication workflow, and archive lifecycle for later changes.

## Goals / Non-Goals

**Goals:**
- Define shared TypeScript contracts for draft content records and management API inputs.
- Add content domain behavior for record creation, replacement, patching, deletion, versioning, timestamps, immutable content type identity, and defensive data handling.
- Add application use cases that coordinate folder lookup, schema resolution, validation, and repository persistence.
- Add an in-memory content repository behind a repository port.
- Expose `/api/management/contents` REST endpoints from `content-service`.
- Wire folder deletion to reject folders with assigned content through the content repository.
- Cover domain, application, repository, and controller behavior with tests.

**Non-Goals:**
- No Angular screens or frontend integration.
- No API Gateway route or runtime auth enforcement beyond existing/documented permission metadata patterns.
- No MongoDB repository, migrations, or production persistence.
- No publication workflow, approval states, published status, archive status, or soft-delete lifecycle.
- No deep patch semantics; `PATCH` performs only shallow field-level merging of `data`.

## Decisions

1. Use a dedicated content record capability and repository port.

   Rationale: Content records are a core aggregate with lifecycle, validation, and folder assignment rules distinct from schemas and folders. A `ContentRepository` keeps use cases independent from the in-memory implementation and allows MongoDB to be added later without changing application behavior.

   Alternative considered: Store content records inside folder infrastructure. This would couple content lifecycle to folder hierarchy and make later persistence/workflow changes harder.

2. Persist the resolved schema version on each content record.

   Rationale: Create requests may omit `schemaVersion`, but content must remain tied to the concrete schema version used for validation. Updates without an explicit `schemaVersion` validate against the stored version, making behavior deterministic after newer schema versions are introduced.

   Alternative considered: Always validate updates against latest active schema. That would make existing records change validation behavior unexpectedly when schemas evolve.

3. Keep `contentType` immutable after creation.

   Rationale: Changing a record's type changes the meaning of all fields and validation history. A conflict response is clearer than implicitly converting an existing record to another schema.

   Alternative considered: Allow type changes through replace. This would require migration rules that are out of scope for this backend CRUD slice.

4. Use hard delete for this slice.

   Rationale: Archive and publication lifecycle rules are not specified yet. Hard delete is simple, testable, and avoids inventing states that may conflict with later workflow design.

   Alternative considered: Introduce soft delete now. This would add lifecycle semantics before the archive workflow exists.

5. Keep the in-memory repository defensive and deterministic.

   Rationale: Tests and callers should not mutate repository state by retaining object references. Deterministic ordering by `createdAt`, then `contentId`, makes list responses stable.

   Alternative considered: Return stored object references and insertion order. That is simpler but leaks mutable state and creates brittle tests.

6. Implement `PATCH` as shallow `data` merge plus optional folder/schema version changes.

   Rationale: Shallow field-level patching is sufficient for current schema field types and avoids introducing JSON Patch or deep merge semantics. The full resulting `data` object is validated before persistence.

   Alternative considered: JSON Patch. It is more expressive but adds parsing and edge-case behavior not needed for Phase 3.

## Risks / Trade-offs

- [Risk] In-memory persistence loses records on restart. Mitigation: Keep persistence behind `ContentRepository` so MongoDB can replace it later.
- [Risk] Hard delete may conflict with future archive requirements. Mitigation: Scope hard delete explicitly to this slice and defer lifecycle states to the archive/workflow change.
- [Risk] Shallow patch semantics may not support future nested field types. Mitigation: Current schemas use primitive fields only; deeper semantics can be added with new requirements if nested fields are introduced.
- [Risk] Folder deletion and content repository wiring creates module dependency concerns. Mitigation: Depend on the existing `FolderContentReader` port and implement it through the content repository rather than coupling folder domain code to content infrastructure.

## Migration Plan

No data migration is required because persistence remains in-memory. Deployment consists of adding shared types, content-service domain/application/infrastructure/presentation code, and tests. Rollback removes the new content endpoints and repository wiring; no persisted production data is affected.

## Open Questions

- None for this backend-only slice. Workflow states, MongoDB persistence, Gateway authorization, and UI behavior are deferred to later changes.
