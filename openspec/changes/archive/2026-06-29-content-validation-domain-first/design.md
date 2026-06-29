## Context

The content type schema slice now defines how author-facing schemas are parsed, normalized, versioned, and looked up. The next Phase 3 step is validating content instance data against those schema definitions inside `content-service`, before content CRUD, REST contracts, or MongoDB persistence are introduced.

The existing scaffold already contains shared validation types, a content validation domain function, a `ValidateContentInstanceUseCase`, a `ContentTypeSchemaReader` port, and an in-memory reader adapter. This change completes and hardens that domain-first slice with explicit requirements and test coverage.

## Goals / Non-Goals

**Goals:**

- Validate content instance data against `ContentTypeSchemaDefinition` using deterministic domain logic.
- Reject non-object content data, unknown fields, forbidden object keys, missing required fields, present `null` or `undefined` values, and invalid field values.
- Validate supported field types: `string`, `integer`, `date`, and `time`.
- Keep empty strings valid, including for required string fields.
- Resolve latest active schema by default and explicit schema version when requested through an application use case.
- Return structured `ContentValidationResult` values for normal validation failures.
- Throw an application error only when schema resolution fails.

**Non-Goals:**

- Do not add REST endpoints, DTOs, API Gateway routes, Angular screens, MongoDB persistence, or API contract tests.
- Do not validate nested objects, arrays, rich text, enums, references, or custom constraints.
- Do not implement content CRUD or schema-driven form generation.
- Do not change the content type schema service contract in this slice.

## Decisions

1. Keep validation as pure domain logic.

   `validateContentInstanceData(schema, data)` remains a framework-free domain function. This makes rule coverage fast and keeps validation reusable by future controllers, workers, or import flows. The alternative, placing validation inside a controller or persistence adapter, would couple business rules to infrastructure too early.

2. Use shared structural types.

   `packages/shared-types` owns `ContentInstanceData`, `ContentValidationError`, `ContentValidationResult`, and `ContentInstanceValidationInput`. These are compile-time contracts shared across services and future UI/API layers. Runtime decisions stay in the domain validator.

3. Return validation results for business validation failures.

   Invalid content data is expected user input, so the validator returns `{ valid: false, errors: [...] }` instead of throwing. The use case throws only when it cannot resolve the required schema, because that is an application/infrastructure problem rather than a normal content validation outcome.

4. Resolve schemas behind a reader port.

   `ValidateContentInstanceUseCase` depends on `ContentTypeSchemaReader`, with methods for latest active and explicit version lookup. The in-memory reader adapter supports tests now; a later slice can wire the reader to content type service APIs, events, cache, or persistence without changing validation rules.

5. Strict primitive field rules.

   The initial validator supports only `string`, `integer`, `date`, and `time`. Dates MUST use a strict valid ISO calendar date in `YYYY-MM-DD`; times MUST use `HH:mm:ss`; integers MUST be JavaScript numbers where `Number.isInteger(value)` is true. This matches the current schema field set and avoids implicit coercion.

6. Security-conscious key handling.

   Content data MUST be a plain JSON-like object, not an array or scalar. Dangerous keys such as `__proto__`, `prototype`, and `constructor` are rejected to avoid prototype-pollution-like behavior. Unknown keys are rejected so persisted content cannot drift outside the schema.

## Risks / Trade-offs

- Latest active schema source is only an in-memory test adapter in this slice -> Keep the reader as a port and defer real integration to a later change.
- Strict primitive validation may reject values authors expect to coerce -> Avoid coercion now for predictable validation and security; add explicit coercion rules only through future specs.
- Empty required strings are valid -> This matches current docs, but future editorial constraints may need min-length validation.
- Unknown fields are rejected -> This protects schema integrity but makes forward compatibility explicit rather than permissive.
- Date/time parsing can be subtly permissive in JavaScript -> Use regex plus calendar validation for dates and strict regex for times.

## Migration Plan

No data migration is required. The change is limited to shared types, content-service domain/application/infrastructure test support, and tests. Rollback is a source/test revert.

## Open Questions

- Should later validation support arrays, nested objects, enum values, regex constraints, min/max, or references?
- Should validation errors eventually include machine-readable metadata beyond `field`, `code`, and `message`?
- How should the production schema reader obtain latest active schemas: direct service call, cache, replicated read model, or shared package adapter?
