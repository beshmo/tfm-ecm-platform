## Why

Content type schema management currently stops at read-only discovery, even though the domain and application layers already support creating, replacing, and deactivating schema versions. Phase 3 needs an administrator-facing path to manage author-facing YAML schemas through the gateway while enforcing production-safe YAML request size limits.

## What Changes

- Expose Content Type Service REST endpoints to create schema versions, replace active schema versions, and soft deactivate schema versions.
- Add request DTOs for JSON envelopes containing YAML schema source text and return structured validation feedback for invalid YAML or schema rules.
- Route content type schema write requests through the API Gateway under `/api/management/content-types`.
- Add configurable maximum YAML schema payload size enforcement for production requests, with a safe default matching the existing parser limit.
- Add Management Frontend content type schema administration screens that use a YAML textarea for create and replace workflows, with inline validation feedback.
- Extend frontend API clients and tests for schema create, replace, deactivate, error mapping, and route coverage.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-type-schemas`: Adds write REST endpoints, gateway routing for schema writes, DTO/error behavior, soft deactivation exposure, and configurable YAML payload size enforcement.
- `management-content-authoring`: Adds Angular content type schema administration screens using a YAML textarea with strong validation feedback.

## Impact

- Affected backend code: `services/content-type-service`, `services/api-gateway`, `packages/shared-yaml`.
- Affected frontend code: `apps/management-frontend/src/app/features/content-types`, Angular routes, and related tests.
- Affected contracts: management REST API under `/api/management/content-types`.
- Affected configuration: new environment setting for maximum content type schema YAML payload size.
- No MongoDB persistence is introduced by this change; existing in-memory schema repository behavior remains the persistence boundary for this phase.
