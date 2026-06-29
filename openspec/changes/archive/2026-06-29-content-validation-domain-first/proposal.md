## Why

Phase 3 needs executable validation of content instance data against content type schemas before content CRUD and persistence are added. Completing this as a domain-first backend slice keeps schema-driven business rules testable and reusable before REST, MongoDB, API Gateway, or Angular integration expands the blast radius.

## What Changes

- Complete and harden shared content instance validation types in `packages/shared-types`.
- Complete and harden `content-service` domain validation for content instance data.
- Validate required fields, unknown fields, supported field types, optional missing fields, present `null` or `undefined` values, and dangerous object keys.
- Preserve current documented behavior that empty strings are valid strings, including for required string fields.
- Add `ValidateContentInstanceUseCase` application behavior that resolves latest active schema by default or an explicit schema version when provided.
- Add or harden a `ContentTypeSchemaReader` port and in-memory schema reader adapter for tests.
- Return normalized validation results for normal validation failures and throw only for application/infrastructure problems such as a missing schema.
- Defer REST endpoints, MongoDB persistence, API Gateway routing, Angular UI, and API contract tests.

## Capabilities

### New Capabilities

- `content-validation`: Content instance data can be validated against content type schemas through backend domain and application use cases, returning structured validation results.

### Modified Capabilities

- None.

## Impact

- Affected code: `packages/shared-types/src` and `services/content-service/src`.
- Affected tests: shared type tests, content service domain tests, application use case tests, and in-memory schema reader tests.
- APIs and UI: no REST controllers, API Gateway routes, Angular screens, or API contracts are implemented in this slice.
- Persistence: no MongoDB repository or database migration is implemented in this slice.
