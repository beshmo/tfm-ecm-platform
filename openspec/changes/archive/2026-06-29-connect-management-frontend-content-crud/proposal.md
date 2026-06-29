## Why

Phase 3 needs the Management Frontend to become a usable authoring surface instead of a route skeleton. Backend folder and content CRUD endpoints already exist, but authors cannot yet browse folders, manage draft content records, or use schema-driven forms through the intended API Gateway path.

## What Changes

- Add API Gateway routing for management folder, content, and content type schema API families.
- Add read-only Content Type Service REST endpoints for listing active schemas and retrieving latest or explicit schema versions.
- Seed an initial active `generic` schema for in-memory development so frontend forms and content validation use the same available schema.
- Add Angular HTTP configuration and gateway-based clients for folders, contents, and content type schemas.
- Expand the folder explorer into an authoring workspace that lists folders, lists content for the selected folder, and supports creating, editing, and deleting draft content records.
- Render content create/edit forms from content type schema field definitions and display loading, empty, validation-error, not-found, and conflict states.
- Keep MongoDB persistence, authentication UI, JWT enforcement, publication actions, unpublication actions, and full content type authoring screens out of scope.

## Capabilities

### New Capabilities

- `management-content-authoring`: Management Frontend authors can browse folders and manage draft content records through schema-driven forms connected to gateway APIs.

### Modified Capabilities

- `content-type-schemas`: Content type schemas expose read-only management REST endpoints for frontend schema discovery.
- `content-record-management`: Content record management supports the frontend integration path through API Gateway routing and seeded in-memory schema availability for valid draft creation.
- `hierarchical-folder-management`: Folder management supports the frontend integration path through API Gateway routing for folder browsing.

## Impact

- Affected code: `apps/management-frontend/src`, `services/api-gateway/src`, `services/content-type-service/src`, and Content Service in-memory schema wiring.
- Affected APIs: gateway-visible management routes under `/api/management/folders`, `/api/management/contents`, and `/api/management/content-types`.
- Affected tests: backend controller/routing tests, content schema seed smoke coverage, frontend API client tests, and folder explorer component tests.
- Dependencies: Angular `HttpClient` is already available through `@angular/common`; API Gateway may add a small HTTP proxy/client implementation using platform APIs or an approved dependency.
