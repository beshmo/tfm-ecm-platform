## Context

The platform is entering Phase 3, where schema-driven content definitions become executable platform behavior. The Content Type Service owns content type schemas and validation rules, while shared packages provide reusable YAML handling and TypeScript contracts. The current scope is intentionally backend-only and domain-first: it proves the schema model, parser, validation rules, version lookup, replacement, listing, and soft deactivation before exposing HTTP endpoints or persisting schemas in MongoDB.

The implementation spans `services/content-type-service`, `packages/shared-yaml`, and `packages/shared-types`. The presentation layer remains limited to the existing health endpoint in this slice.

## Goals / Non-Goals

**Goals:**

- Model content type schemas with domain objects, value-oriented validation behavior, explicit domain errors, and repository ports.
- Parse author-facing YAML into normalized JSON-compatible schema definitions with strict allowlists.
- Provide application use cases for create, replace, get latest active, get specific version, list active summaries, and deactivate schema versions.
- Use an in-memory repository adapter as the first persistence boundary implementation.
- Cover domain, application, parser, shared type, and security behavior with BDD-style tests.

**Non-Goals:**

- Do not add REST CRUD endpoints, DTOs, API Gateway routes, or Angular screens.
- Do not add MongoDB persistence or migrations.
- Do not validate content instances against schemas in this slice.
- Do not introduce field types beyond `string`, `integer`, `date`, and `time`.
- Do not implement advanced schema revision history beyond version identity and soft deactivation.

## Decisions

1. Domain-first service slice.

   Implement schema lifecycle behavior under `services/content-type-service/src/domain` and `src/application`, keeping NestJS details out of domain and use-case code. This matches the repository's Clean Architecture guidance and allows domain/application tests to run without HTTP or database fixtures. The alternative, starting with controllers and persistence, would slow feedback and make schema rules harder to test in isolation.

2. Shared YAML parser as a strict boundary adapter.

   `packages/shared-yaml` owns parsing author-facing YAML and returning normalized `ContentTypeSchemaDefinition` objects. It MUST reject invalid YAML, unsupported keys, unsafe keys, oversized input, ambiguous YAML features, and unsupported field types instead of coercing them. Keeping this in a shared package avoids duplicating parser behavior when future services need the same normalized schema contract. The alternative, parsing inside the service use case, would couple input normalization to one service.

3. Shared structural contracts.

   `packages/shared-types` owns the schema definition and summary types: `ContentTypeName`, `ContentTypeVersion`, `ContentFieldType`, `ContentTypeFieldDefinition`, `ContentTypeSchemaDefinition`, and `ContentTypeSchemaSummary`. These remain structural TypeScript types rather than framework DTOs so they can be reused across backend services and future frontend/API layers. Runtime validation still lives in parser/domain code.

4. Repository port plus in-memory adapter.

   The domain/application layer depends on a `ContentTypeSchemaRepository` port. The first adapter is in-memory, keyed by `name + version`, with latest active lookup based on semantic version ordering. This gives deterministic tests and keeps MongoDB collection design out of this slice. A later change can add a MongoDB adapter without changing use-case contracts.

5. Soft deactivation for delete behavior.

   Deactivation marks a schema version inactive while preserving historical retrieval by explicit `name + version`. Latest lookup and list behavior return active versions only. This protects historical content and future audit needs while still allowing authors to retire schema versions.

6. Security controls at the parsing boundary.

   Schema input is external author-controlled data, so the parser uses size limits, allowlisted keys and field types, blocked prototype-pollution-like keys, sanitized validation errors, and no dynamic execution. These controls align with the architecture's OWASP guidance and should be covered by dedicated tests.

## Risks / Trade-offs

- In-memory storage loses state on process restart -> This is accepted for the domain-first slice; MongoDB persistence is deferred to a later change behind the repository port.
- Semantic version comparison can become more complex later -> Restrict the initial format to `major.minor` or `major.minor.patch` and cover ordering with tests.
- YAML can encode surprising shapes -> Use strict parser options, reject anchors/aliases and unsupported structures, and keep validation allowlist-based.
- Shared types do not enforce runtime invariants -> Treat them as compile-time contracts only and enforce invariants in parser/domain tests.
- No REST layer means no API contract tests yet -> Keep application use cases stable so controllers and contracts can be added as a separate slice.

## Migration Plan

No data migration is required. The change only adds or hardens TypeScript source, tests, and package dependency metadata. Rollback is limited to reverting the new domain/application/shared package changes and lockfile updates.

## Open Questions

- What maximum YAML payload size should be used long-term for production requests?
- Should future schema versions allow richer field metadata such as labels, descriptions, constraints, or nested objects?
- Should future deactivation include audit metadata such as actor and reason?
