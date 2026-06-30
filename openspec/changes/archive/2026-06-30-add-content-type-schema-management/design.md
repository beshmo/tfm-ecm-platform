## Context

Content type schema parsing, validation, version lifecycle, and in-memory repository behavior already exist in the Content Type Service. The current presentation layer exposes only read endpoints, the API Gateway already routes `/api/management/content-types*` to the Content Type Service, and the Management Frontend consumes schemas only for content record authoring.

ADR-0016 establishes YAML as the author-facing schema definition format while keeping REST payloads and persisted/internal contracts JSON-compatible. The first administration UI should therefore let administrators work directly with YAML source text, but requests should still use a JSON envelope and return normalized schema definitions and structured validation feedback.

## Goals / Non-Goals

**Goals:**

- Expose create, replace, and soft deactivate schema version operations through REST endpoints.
- Preserve read endpoints and explicit version retrieval behavior for active and inactive versions.
- Add JSON DTOs containing YAML source text for create and replace requests.
- Enforce a configurable maximum YAML schema source size for production requests while retaining parser-level defense.
- Route write requests through the API Gateway using the existing management proxy boundary.
- Add Angular schema administration screens using a YAML textarea and inline validation feedback.
- Cover backend, gateway, frontend API client, route, and component workflows with focused tests.

**Non-Goals:**

- Introduce a structured schema field-builder UI.
- Introduce MongoDB persistence, migrations, or collection design for content type schemas.
- Add schema compatibility analysis against existing content records.
- Add authentication or authorization enforcement beyond existing route structure.
- Change the normalized schema model or supported field types.

## Decisions

1. Use JSON REST envelopes with YAML source fields.

   Create and replace requests will send `{ "schemaSource": "<yaml>" }`. This keeps REST behavior consistent with ADR-0016 and the current gateway JSON forwarding path while allowing YAML to remain the author-facing editing format. Sending raw `application/x-yaml` was considered, but it would require a separate gateway/body-parser path and would make structured validation responses less consistent with the rest of the management API.

2. Reuse existing application use cases for schema writes.

   The controller should call `CreateContentTypeSchemaUseCase`, `ReplaceContentTypeSchemaVersionUseCase`, and `DeactivateContentTypeSchemaVersionUseCase` rather than duplicate parsing or lifecycle rules in presentation code. Controller DTO validation should only verify request shape and request-size boundaries before passing source text to the application layer.

3. Map domain and parser errors to stable HTTP responses.

   Schema validation errors should return `400` with a sanitized message and validation message list. Duplicate schema versions should return `409`; inactive replacement and identity mismatch should return `409`; missing schemas should return `404`; oversized request payloads should return `413` when rejected at the request boundary.

4. Make YAML source size configurable at the request boundary and parser boundary.

   Add an environment setting such as `CONTENT_TYPE_SCHEMA_YAML_MAX_BYTES`, defaulting to `65536`. The Content Type Service should reject DTO `schemaSource` values that exceed the configured byte length before parsing. The YAML parser should also accept a configurable limit so internal parser calls retain the same guard. Gateway JSON body parsing may need a matching or larger limit so production requests fail predictably instead of bypassing service validation.

5. Keep API Gateway routing generic for content type writes.

   The existing proxy route already matches `/api/management/content-types` and `/api/management/content-types/*path`. Write coverage should prove `POST`, `PUT`, and `DELETE` preserve method, URL, JSON body, and downstream status/body. No multipart forwarding changes are needed.

6. Add a focused Angular administration page.

   Add a route such as `/content-types` backed by a standalone content type schemas page. The page should list active schema summaries, show selected normalized schema details, provide create and replace YAML textareas, and confirm deactivation. Validation messages from the API client should remain visible inline without clearing YAML input.

## Risks / Trade-offs

- [Risk] YAML textarea editing is powerful but less guided than a field builder. -> Mitigation: provide strong inline validation feedback, preserve input after failures, and show normalized schema details after success.
- [Risk] Gateway and service body-size limits can diverge. -> Mitigation: document the configuration and test service-level DTO limit behavior; keep defaults aligned with parser limits.
- [Risk] In-memory repository means schema changes are not durable across service restarts. -> Mitigation: keep this explicit in specs and proposal; defer MongoDB persistence to a later change.
- [Risk] Replacing an active schema version can affect future content validation expectations. -> Mitigation: keep replacement scoped to same `name + version`, preserve explicit version lookups, and defer compatibility checks until persistence/content usage history is available.
- [Risk] Soft deactivation can remove a schema from active authoring while existing content still references it. -> Mitigation: explicit version reads continue to return inactive versions so content editing and historical display can still resolve stored schemas.
