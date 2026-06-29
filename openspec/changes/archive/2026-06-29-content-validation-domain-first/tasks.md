## 1. Shared Contracts

- [x] 1.1 Confirm or add shared validation types in `packages/shared-types/src`: `ContentInstanceData`, `ContentValidationError`, `ContentValidationResult`, and `ContentInstanceValidationInput`.
- [x] 1.2 Add or update shared type tests for validation error codes, normalized validation result shape, and optional `schemaVersion`.

## 2. Domain Validation

- [x] 2.1 Add or update BDD-style domain tests for valid content instances, required fields, optional missing fields, empty required strings, and present `null` or `undefined` values.
- [x] 2.2 Add or update BDD-style domain tests for unknown fields and forbidden keys: `__proto__`, `prototype`, and `constructor`.
- [x] 2.3 Add or update BDD-style domain tests for invalid `string`, `integer`, `date`, and `time` values.
- [x] 2.4 Add or update BDD-style domain tests for non-object content data, including arrays, scalars, and `null`.
- [x] 2.5 Implement or harden `validateContentInstanceData` so it returns normalized `ContentValidationResult` values without throwing for normal validation failures.

## 3. Schema Reader Port And In-Memory Adapter

- [x] 3.1 Confirm or add the `ContentTypeSchemaReader` port with latest active and explicit version lookup methods.
- [x] 3.2 Add or update tests for the in-memory schema reader covering add, latest active lookup, explicit version lookup, missing schema lookup, semantic version ordering, and defensive cloning.
- [x] 3.3 Implement or harden the in-memory schema reader adapter for deterministic application tests.

## 4. Application Use Case

- [x] 4.1 Add or update BDD-style tests proving latest active schema lookup is used when `schemaVersion` is omitted.
- [x] 4.2 Add or update BDD-style tests proving explicit schema version lookup is used when `schemaVersion` is provided.
- [x] 4.3 Add or update BDD-style tests proving missing schema lookup throws `ContentTypeSchemaNotFoundError`.
- [x] 4.4 Add or update BDD-style tests proving multiple validation errors are returned together.
- [x] 4.5 Implement or harden `ValidateContentInstanceUseCase` so normal validation failures return results and schema lookup failures throw application errors.

## 5. Scope Guards

- [x] 5.1 Verify the Content Service presentation layer remains limited to the existing health endpoint in this slice.
- [x] 5.2 Verify no MongoDB repository, database migration, REST content validation endpoint, content CRUD endpoint, API Gateway route, Angular screen, or API contract test is added by this change.

## 6. Verification

- [x] 6.1 Run `pnpm --filter @ecmp/shared-types test`.
- [x] 6.2 Run `pnpm --filter @ecmp/content-service test`.
- [x] 6.3 Run `pnpm typecheck`.
- [x] 6.4 Run `pnpm lint`.
- [x] 6.5 Run `pnpm build`.
