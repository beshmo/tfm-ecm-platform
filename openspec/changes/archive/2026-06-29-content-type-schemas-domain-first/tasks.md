## 1. Shared Contracts

- [x] 1.1 Confirm or add shared schema types in `packages/shared-types/src`: `ContentTypeName`, `ContentTypeVersion`, `ContentFieldType`, `ContentTypeFieldDefinition`, `ContentTypeSchemaDefinition`, and `ContentTypeSchemaSummary`.
- [x] 1.2 Add or update shared type tests covering supported field type literals and schema definition shape.

## 2. YAML Parsing And Normalization

- [x] 2.1 Add BDD-style parser tests for valid YAML normalization and `required` defaulting to `false`.
- [x] 2.2 Add BDD-style parser tests for invalid YAML, missing `name`, missing `version`, missing or invalid `fields`, and empty field definitions.
- [x] 2.3 Add BDD-style parser tests for supported field types and unsupported field type rejection.
- [x] 2.4 Add security-focused parser tests for oversized YAML, unknown top-level keys, unsupported field keys, prototype-pollution-like keys, unsafe field names, aliases/anchors, and sanitized errors.
- [x] 2.5 Implement or harden the strict YAML parser so it returns normalized `ContentTypeSchemaDefinition` objects and rejects unsupported or ambiguous schema shapes.

## 3. Domain Model And Repository Port

- [x] 3.1 Add or update domain tests for schema record creation, active status, timestamps, summaries, semantic version comparison, and schema key generation.
- [x] 3.2 Add or update domain tests for soft deactivation preserving history while marking a version inactive.
- [x] 3.3 Implement or harden domain functions, domain errors, and the `ContentTypeSchemaRepository` port needed by the use cases.

## 4. In-Memory Repository

- [x] 4.1 Add repository tests for saving, replacing, finding by `name + version`, finding latest active by name, listing active summaries, and deactivating.
- [x] 4.2 Implement or harden the in-memory repository keyed by `name + version`.
- [x] 4.3 Ensure latest active lookup ignores inactive versions and orders versions by semantic version value.

## 5. Application Use Cases

- [x] 5.1 Add BDD-style tests for `CreateContentTypeSchemaUseCase`, including duplicate `name + version` rejection.
- [x] 5.2 Add BDD-style tests for `ReplaceContentTypeSchemaVersionUseCase`, including not found, inactive version, and mismatched YAML identity rejection.
- [x] 5.3 Add BDD-style tests for `GetContentTypeSchemaUseCase` and `GetContentTypeSchemaVersionUseCase`, including latest active and explicit inactive retrieval.
- [x] 5.4 Add BDD-style tests for `ListContentTypeSchemasUseCase` and `DeactivateContentTypeSchemaVersionUseCase`.
- [x] 5.5 Implement or harden the create, replace, get latest active, get specific version, list active, and deactivate use cases.

## 6. Scope Guards

- [x] 6.1 Verify the Content Type Service presentation layer remains limited to the existing health endpoint in this slice.
- [x] 6.2 Verify no MongoDB repository, database migration, API Gateway route, REST CRUD controller, Angular content type screen, or content instance validation is added by this change.

## 7. Verification

- [x] 7.1 Run `pnpm --filter @ecmp/shared-types test`.
- [x] 7.2 Run `pnpm --filter @ecmp/shared-yaml test`.
- [x] 7.3 Run `pnpm --filter @ecmp/content-type-service test`.
- [x] 7.4 Run `pnpm typecheck`.
- [x] 7.5 Run `pnpm lint`.
- [x] 7.6 Run `pnpm build`.
