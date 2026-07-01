## 1. Shared Schema Contract

- [x] 1.1 Extend `ContentFieldType` with `boolean`, `datetime`, `decimal`, `html`, and `uri`.
- [x] 1.2 Extend content validation error codes with `INVALID_BOOLEAN`, `INVALID_DATETIME`, `INVALID_DECIMAL`, `INVALID_HTML`, and `INVALID_URI`.
- [x] 1.3 Update shared seed schemas and shared type tests to cover the expanded field type set.
- [x] 1.4 Decide and document the initial accepted URI scheme policy in tests.

## 2. YAML Schema Parsing

- [x] 2.1 Add the extended field types to the strict YAML parser allowlist.
- [x] 2.2 Add parser tests proving schemas with all extended field types are accepted in field order.
- [x] 2.3 Keep unsupported field type tests proving non-allowlisted types are rejected.

## 3. Content Instance Validation

- [x] 3.1 Add domain validation for boolean values with no string coercion.
- [x] 3.2 Add domain validation for timezone-aware datetime strings requiring `Z` or an explicit numeric offset.
- [x] 3.3 Add domain validation for finite decimal numbers while preserving strict integer behavior.
- [x] 3.4 Add domain validation for HTML-formatted text as strings only.
- [x] 3.5 Add domain validation for absolute URI strings according to the selected URI scheme policy.
- [x] 3.6 Add valid and invalid content validation tests for every extended type and error code.

## 4. Management Frontend

- [x] 4.1 Add the extended field types to schema create and replace field type selectors.
- [x] 4.2 Update generated ordered YAML tests for extended field type selection and replacement preservation.
- [x] 4.3 Render content editor controls for boolean, datetime, decimal, html, and uri fields.
- [x] 4.4 Convert submitted form data to backend-required JSON shapes for boolean and decimal fields.
- [x] 4.5 Preserve datetime timezone text and avoid rendering HTML field values as trusted markup.
- [x] 4.6 Add Angular component integration tests for creating or editing content with extended field types.

## 5. CMIS Projection

- [x] 5.1 Extend CMIS property type mapping for boolean and datetime fields.
- [x] 5.2 Map decimal fields to the selected supported CMIS numeric property type.
- [x] 5.3 Map html and uri fields to CMIS string properties.
- [x] 5.4 Add shared type and CMIS adapter tests for type definitions and object property values with extended fields.

## 6. Documentation and Verification

- [x] 6.1 Update architecture or capability documentation with the expanded field type table and validation semantics.
- [x] 6.2 Document the HTML rendering security constraint: stored HTML is not trusted DOM markup without sanitization.
- [x] 6.3 Run `pnpm typecheck`.
- [x] 6.4 Run `pnpm test`.
- [x] 6.5 Run `pnpm lint`.
- [x] 6.6 Run `pnpm build`.
