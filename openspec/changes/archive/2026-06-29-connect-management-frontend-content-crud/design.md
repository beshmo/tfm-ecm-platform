## Context

The repository is in Phase 3. The Content Service already exposes folder and draft content CRUD endpoints, and shared contracts exist in `@ecmp/shared-types`. The Content Type Service has domain and application use cases for schema lifecycle, but it does not yet expose REST endpoints. The API Gateway currently has only health behavior, while the architecture requires the Management Frontend to communicate with backend services through the gateway.

The Management Frontend is still a standalone Angular route skeleton. This change connects it to the existing management APIs and adds the smallest missing backend surface needed for schema-driven content forms.

## Goals / Non-Goals

**Goals:**

- Route management folder, content, and content type read requests through the API Gateway.
- Expose read-only content type schema endpoints for schema discovery.
- Make the frontend folder explorer load real folders and folder content from gateway APIs.
- Support create, edit, and delete for draft content records through schema-driven Angular forms.
- Seed the same initial `generic` schema into in-memory schema discovery and content validation paths for local development.

**Non-Goals:**

- MongoDB persistence or schema synchronization between services.
- Authentication UI, JWT validation, RBAC enforcement, or token propagation.
- Content type authoring screens or write-side content type REST APIs.
- Publication, unpublication, static file management, or delivery APIs.

## Decisions

1. Route through the API Gateway now.

   The frontend will call relative `/api/management/...` URLs. The gateway will forward `/api/management/folders*` and `/api/management/contents*` to the Content Service, and `/api/management/content-types*` to the Content Type Service. This matches the architecture and avoids teaching Angular about service-specific ports. Direct service calls were considered for speed, but they would create a frontend contract that must be undone later.

2. Add read-only content type schema REST endpoints only.

   The Content Type Service will expose list, latest, and explicit-version reads using the existing use cases and shared response contracts. Create, replace, and deactivate REST endpoints remain deferred because this change only needs schemas to render content forms.

3. Seed an initial `generic` schema in memory.

   Until MongoDB and cross-service schema sharing exist, both the Content Type Service repository and the Content Service validation reader will be initialized with the same `generic` version `1.0` schema. This makes schema discovery and content validation agree during local development. A service-to-service schema lookup was considered, but it would add network coupling before persistence and caching decisions are settled.

4. Keep Angular state local to the folder explorer slice.

   The first implementation will use standalone services and component-local state rather than introducing a global store. The workflow is small, and Angular signals or simple observable state can cover loading, selected folder, selected schema, modal mode, and errors without adding a new dependency.

5. Use schema fields to build typed form controls.

   The editor will render one control per field in `ContentTypeSchemaDefinition.fields`: text for `string`, number for `integer`, date for `date`, and time for `time`. Required fields are enforced in the UI and validated again by the backend. Unknown fields are not emitted by the form.

## Risks / Trade-offs

- In-memory schema seeds can drift between services -> Define the seed in one shared source or mirrored constant with tests that assert both services expose/accept the same `generic` schema.
- Gateway proxy behavior can accidentally drop status codes or error payloads -> Add routing tests that cover success, 400 validation responses, 404, 409, and backend unavailable responses.
- Schema-driven forms may feel limited with only four field types -> Keep the renderer deliberately minimal and rely on future content type work to expand field capabilities.
- The frontend has no real auth yet -> Keep the API client and UI ready for later headers/interceptors, but do not fake authorization behavior in this slice.
- Component complexity may grow quickly -> Keep API clients, form mapping, and view-model helpers outside the presentation component where they are independently testable.
