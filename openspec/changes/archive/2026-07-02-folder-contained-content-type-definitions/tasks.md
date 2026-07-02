## 1. Service Boundary Migration

- [x] 1.1 Move content type schema domain, application, infrastructure, config, providers, controller, and tests from `services/content-type-service` into `services/content-service` while preserving existing behavior.
- [x] 1.2 Wire Content Service to provide content type schema use cases and expose existing `/api/management/content-types` routes.
- [x] 1.3 Replace `HttpContentTypeSchemaReader` usage in Content Service with a local schema repository/reader implementation.
- [x] 1.4 Seed the initial generic content type schema from the merged Content Service provider setup.
- [x] 1.5 Update API Gateway routing and tests so `/api/management/content-types` forwards to Content Service.
- [x] 1.6 Remove standalone Content Type Service runtime wiring from package scripts, Docker Compose, service URL config, and backend test filters where applicable.

## 2. Repository Object Model

- [x] 2.1 Add shared types for content type definition repository objects, including identifier, folder location, name, active version summaries, and timestamps.
- [x] 2.2 Evolve the schema repository contract to support definition-level folder location, lookup by name/version, active listing, folder-scoped listing, and move operations.
- [x] 2.3 Update in-memory schema repository implementation and tests for grouped versions under folder-contained content type definitions.
- [x] 2.4 Preserve existing schema create, replace, deactivate, latest lookup, explicit version lookup, duplicate, inactive, mismatch, and YAML validation behavior.
- [x] 2.5 Add content type definition move use case and controller route with not-found, invalid target, and conflict handling.

## 3. System Folder Rules

- [x] 3.1 Seed reserved `/system` and `/system/schemas` folders alongside `FLD-root` in folder repository setup.
- [x] 3.2 Add centralized protected-folder and schema-namespace checks for `/system` and `/system/schemas`.
- [x] 3.3 Reject rename, move, and delete operations for protected system folders with focused domain/application tests.
- [x] 3.4 Add schema-folder creation and movement rules that keep schema folders under `/system/schemas`.
- [x] 3.5 Reject normal content record creation and document upload in `/system`, `/system/schemas`, and schema namespace descendants.
- [x] 3.6 Include content type definitions in folder occupancy checks so schema folders containing definitions cannot be deleted.

## 4. Authorization

- [x] 4.1 Add or reuse backend authorization plumbing for administrator-only schema administration operations.
- [x] 4.2 Enforce admin-only access for schema folder browsing, schema folder mutations, schema create/replace/deactivate, and content type definition moves.
- [x] 4.3 Keep active schema consumption for content authoring available to non-admin authoring workflows where required.
- [x] 4.4 Add tests for forbidden non-admin schema administration requests.

## 5. Frontend Administration

- [x] 5.1 Extend frontend folder/content type API clients to load schema folder context and folder-scoped content type definitions through gateway URLs.
- [x] 5.2 Redesign the content type schema administration page to browse `/system/schemas` with schema subfolders and folder-contained definitions.
- [x] 5.3 Add schema folder create and content type definition move interactions with loading, error, forbidden, and refresh states.
- [x] 5.4 Preserve existing create, replace, deactivate, validation feedback, and oversized payload handling in the folder-scoped administration UI.
- [x] 5.5 Update Angular unit, component, and route integration tests for schema folder browsing and schema administration workflows.

## 6. CMIS And Object-Type Behavior

- [x] 6.1 Update ECMP object-type mapping so content type definition instances are represented as repository objects while content records still reference user content types.
- [x] 6.2 Preserve CMIS type discovery for active user content types after schema ownership moves into Content Service.
- [x] 6.3 Ensure CMIS folder navigation does not expose `/system/schemas` administrative objects for this slice.
- [x] 6.4 Add or update CMIS tests for type discovery and hidden schema administration namespace behavior.

## 7. Verification

- [x] 7.1 Run focused Content Service tests for schema management, content validation, folders, content records, documents, and CMIS behavior.
- [x] 7.2 Run focused API Gateway tests for content type routing to Content Service.
- [x] 7.3 Run focused Management Frontend tests for content type schema administration and folder explorer regressions.
- [x] 7.4 Run repository-level `pnpm typecheck`, `pnpm lint`, and relevant backend/frontend test suites.
- [x] 7.5 Update OpenSpec artifacts if implementation decisions change any requirement or design assumption.
