## 1. Backend Schema Read API

- [x] 1.1 Add a shared initial `generic` content type schema definition used by in-memory development wiring.
- [x] 1.2 Seed the Content Type Service in-memory repository with `generic` version `1.0`.
- [x] 1.3 Seed the Content Service in-memory content validation reader with the same `generic` version `1.0` schema.
- [x] 1.4 Add Content Type Service read-only controller routes for list, latest schema, and explicit schema version retrieval.
- [x] 1.5 Map missing content type schemas to `404` responses and unexpected schema read errors safely.
- [x] 1.6 Add Content Type Service controller tests for successful list/latest/version reads and missing schema reads.
- [x] 1.7 Add Content Service coverage proving valid `generic` content can be created without an explicit schema version.

## 2. API Gateway Routing

- [x] 2.1 Add gateway service URL configuration for Content Service and Content Type Service with docker defaults and local fallbacks.
- [x] 2.2 Implement gateway forwarding for `/api/management/folders*` to the Content Service.
- [x] 2.3 Implement gateway forwarding for `/api/management/contents*` to the Content Service.
- [x] 2.4 Implement gateway forwarding for `/api/management/content-types*` to the Content Type Service.
- [x] 2.5 Preserve forwarded method, path, query string, JSON body, response status, and response body for management API requests.
- [x] 2.6 Return a clear gateway error response when a target service is unavailable.
- [x] 2.7 Add API Gateway tests for folder, content, content type, error-preservation, and unavailable-service routing behavior.

## 3. Frontend API Layer

- [x] 3.1 Register Angular `provideHttpClient` in the Management Frontend application config.
- [x] 3.2 Add folder API client methods for listing folders and retrieving a folder through relative `/api/management/folders` URLs.
- [x] 3.3 Add content API client methods for listing by folder, creating, replacing, and deleting content through relative `/api/management/contents` URLs.
- [x] 3.4 Add content type API client methods for listing active schemas and retrieving latest or explicit schema definitions.
- [x] 3.5 Add frontend error mapping for validation, not-found, conflict, and generic request failures.
- [x] 3.6 Add unit tests for frontend API clients and error mapping.

## 4. Frontend Authoring Workspace

- [x] 4.1 Replace the folder explorer placeholder with a data-backed folder tree/list that selects `FLD-root` by default.
- [x] 4.2 Load and render selected-folder content records in a table with content ID, type, version, status, and updated timestamp.
- [x] 4.3 Add loading, empty, and inline error states for folder, content, and schema requests.
- [x] 4.4 Add a create-content flow that loads active content type summaries, retrieves the chosen schema, renders schema fields, and submits a create request for the selected folder.
- [x] 4.5 Add an edit-content flow that retrieves the stored schema version, renders existing data, and submits a replace request.
- [x] 4.6 Add a delete-content confirmation flow that sends delete requests and refreshes the selected folder content list.
- [x] 4.7 Keep form data visible when backend validation or conflict errors occur.
- [x] 4.8 Add component tests for folder loading, folder selection, content loading, create, edit, delete, validation error display, and empty states.
- [x] 4.9 Update route tests only as needed to preserve `/folders` and `/folders/:folderId` behavior.

## 5. Verification

- [x] 5.1 Run `pnpm test:backend` and fix failures.
- [x] 5.2 Run `pnpm test:frontend` and fix failures.
- [x] 5.3 Run `pnpm typecheck` and fix failures.
- [x] 5.4 Run `pnpm build` and fix failures.
- [x] 5.5 Run `openspec validate --changes connect-management-frontend-content-crud` and fix proposal/spec validation issues.
