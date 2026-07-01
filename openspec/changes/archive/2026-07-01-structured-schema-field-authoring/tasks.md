## 1. Shared Schema Contract

- [x] 1.1 Add `ContentTypeSchemaField` to `packages/shared-types` with `name`, `type`, and `required`.
- [x] 1.2 Change `ContentTypeSchemaDefinition.fields` from a keyed record to `ContentTypeSchemaField[]`.
- [x] 1.3 Update `INITIAL_GENERIC_CONTENT_TYPE_SCHEMA` and shared type tests to use ordered field arrays.
- [x] 1.4 Update CMIS/object-type projection helpers to iterate schema field arrays in order.

## 2. YAML Parser and Schema Service

- [x] 2.1 Update `packages/shared-yaml` parser tests for ordered field sequence YAML and normalized ordered field arrays.
- [x] 2.2 Reject legacy field mappings with a validation message that fields must be an ordered sequence.
- [x] 2.3 Validate field entry `name`, `type`, `required`, duplicate names, unknown field keys, and unsafe names.
- [x] 2.4 Update Content Type Service use case and repository tests for ordered schema fields.
- [x] 2.5 Update schema cloning in the in-memory schema repository to preserve field array order and isolation.

## 3. Content Validation and Consumers

- [x] 3.1 Update content validation to build field-name lookup maps from ordered schema fields.
- [x] 3.2 Update Content Service tests and schema fixtures to use ordered field arrays.
- [x] 3.3 Update Management Frontend folder explorer schema rendering, form initialization, and data conversion to iterate ordered schema fields.
- [x] 3.4 Update frontend content authoring tests to assert field order where schemas define multiple fields.

## 4. Structured Schema Administration UI

- [x] 4.1 Introduce a schema draft model in the content type schemas page with `name`, `version`, and ordered `fields[]`.
- [x] 4.2 Replace create schema textarea controls with structured controls for field name, field type, required toggle, add, remove, and reorder.
- [x] 4.3 Replace selected-schema replacement textarea controls with a structured draft initialized from the selected schema.
- [x] 4.4 Generate deterministic ordered YAML from schema drafts before create and replace API calls.
- [x] 4.5 Preserve draft state and display backend validation, conflict, not-found, and oversized payload errors inline.
- [x] 4.6 Display selected schema details using explicit schema field order.

## 5. Documentation and Examples

- [x] 5.1 Update OpenSpec or architecture examples that show content type schema YAML to use ordered field sequences.
- [x] 5.2 Update any test helper YAML snippets and seed schemas to the clean-break ordered YAML shape.
- [x] 5.3 Confirm no repository code still depends on `fields` as a keyed record except local lookup maps derived from `fields[]`.

## 6. Verification

- [x] 6.1 Run `pnpm typecheck`.
- [x] 6.2 Run `pnpm lint`.
- [x] 6.3 Run `pnpm test`.
- [x] 6.4 Run `pnpm test:frontend`.
- [x] 6.5 Run `openspec validate structured-schema-field-authoring`.
