## Why

Phase 3 needs backend content records so authored content can be created, validated, organized in folders, and managed through the Content Service. Existing schema validation and folder hierarchy capabilities provide the prerequisites, but there is not yet a content CRUD API or persistence boundary to connect them.

## What Changes

- Add shared content API contracts for draft content records, create inputs, replace inputs, patch inputs, and content identifiers.
- Add a backend content domain model that generates `RCD-` IDs, initializes records as draft version `1`, increments versions on successful updates, keeps content type immutable, and stores resolved schema versions.
- Add application use cases for listing, retrieving, creating, replacing, patching, and hard-deleting content records.
- Add content repository and ID generator ports plus an in-memory repository with defensive cloning and deterministic list ordering.
- Validate content data against existing content type schemas before persistence, resolving latest active schema versions by default and explicit schema versions when requested.
- Expose Content Service management REST endpoints under `/api/management/contents` with consistent status and error mapping.
- Wire folder deletion occupancy checks to the content repository so folders with assigned content remain non-empty.
- Keep Angular integration, API Gateway auth enforcement, MongoDB persistence, publication workflow, and archive lifecycle out of scope.

## Capabilities

### New Capabilities
- `content-record-management`: Backend management of draft content records, including shared contracts, domain/application behavior, in-memory persistence, REST endpoints, validation integration, and hard delete semantics.

### Modified Capabilities
- `hierarchical-folder-management`: Folder deletion non-empty checks must reject folders with assigned content using the content repository occupancy signal.

## Impact

- Affects `@ecmp/shared-types` by adding content record contracts and related ID/status types.
- Affects `content-service` domain, application, infrastructure, and presentation layers.
- Adds REST API surface under `/api/management/contents`.
- Reuses existing content type schema lookup and content data validation behavior.
- Updates folder deletion wiring to detect assigned content through the new content repository.
- Adds unit and controller test coverage for content CRUD, validation, repository behavior, and folder occupancy.
