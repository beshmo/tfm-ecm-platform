## Why

Phase 3 starts the platform's schema-driven content model, but the current scaffold does not yet provide executable content type schema rules. Building the domain and application slice first gives fast TDD feedback for YAML parsing, normalization, validation, versioning, and lifecycle behavior before adding HTTP and database integration.

## What Changes

- Add a domain-first content type schema capability in `services/content-type-service/src`.
- Implement Clean Architecture layers for domain entities/value objects, application use cases, and an in-memory repository adapter.
- Complete and harden strict YAML parsing and normalization in `packages/shared-yaml/src` for author-facing schema text.
- Complete shared content type schema types in `packages/shared-types/src` where useful.
- Validate initial schema rules for required `name`, `version`, and `fields`, supported field types, safe field names, duplicate fields, reserved internal type names, and unknown schema keys.
- Implement schema version lifecycle behavior with soft deactivation.
- Add domain, application, shared YAML, shared types, and security-focused tests.
- Defer REST endpoints, API Gateway routing, MongoDB persistence, Angular screens, and content instance validation.

## Capabilities

### New Capabilities

- `content-type-schemas`: Author-facing YAML content type schemas can be parsed, normalized, validated, versioned, listed, retrieved, replaced, and softly deactivated through backend domain and application use cases.

### Modified Capabilities

- None.

## Impact

- Affected code: `services/content-type-service/src`, `packages/shared-yaml/src`, and `packages/shared-types/src`.
- Affected tests: content type service domain/application tests, shared YAML tests, shared types tests, and workspace typecheck/lint/build gates.
- Dependencies: may require a YAML parser dependency in the shared YAML package, recorded in the workspace lockfile.
- APIs and UI: no REST contracts, gateway routes, or Angular screens are implemented in this slice.
