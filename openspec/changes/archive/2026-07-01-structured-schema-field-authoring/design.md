## Context

Content type schemas are currently authored as raw YAML and normalized as `ContentTypeSchemaDefinition` objects whose `fields` value is a field-name keyed record. That representation relies on YAML and JavaScript object insertion order when the frontend renders schema fields, and it gives the schema administration screen no durable model for field reordering.

The Management Frontend already consumes schema definitions to render content create/edit forms, and the Content Type Service already accepts `{ "schemaSource": "<yaml>" }` for create and replace operations. This change keeps the YAML source DTO contract but intentionally changes the schema definition shape returned by shared packages and APIs.

## Goals / Non-Goals

**Goals:**

- Make field order explicit in the normalized schema contract.
- Replace schema administration textareas with structured create/replace forms that can add, remove, rename, type, require, and reorder fields.
- Keep content instance data keyed by field name so reordering fields does not migrate stored content values.
- Keep the existing schema create/replace gateway endpoints and YAML source DTO envelope.
- Reject legacy field mapping YAML as part of a clean-break migration.

**Non-Goals:**

- Introduce MongoDB-backed schema persistence.
- Add new content field types beyond `string`, `integer`, `date`, and `time`.
- Make field order affect validation semantics beyond display/projection order.
- Preserve backwards compatibility for legacy YAML field mappings or `fields: Record<string, ...>` API consumers.

## Decisions

### Use an ordered array as the schema field contract

`ContentTypeSchemaDefinition.fields` will become `ContentTypeSchemaField[]`, where each entry contains `name`, `type`, and `required`.

Alternatives considered:

- `fields: Record<string, ContentTypeFieldDefinition>` plus `fieldOrder: string[]`: rejected because it creates two sources of truth, allows missing/extra order entries, and makes conflict resolution ambiguous.
- Continue relying on object insertion order: rejected because the contract does not state order explicitly and does not give the schema editor a durable reorder operation.

### Use an ordered YAML sequence as the canonical author-facing shape

Canonical YAML will use:

```yaml
name: article
version: 1.0
fields:
  - name: title
    type: string
    required: true
  - name: priority
    type: integer
    required: false
```

The parser will reject legacy mapping YAML such as `fields: { title: ... }` with a clear validation message. Field names remain unique, identifier-like, and protected against unsafe key names.

### Keep content instance data keyed by field name

Content records will continue to store `data` as an object keyed by field name. Validation and form helpers will build lookup maps from `schema.fields[]` when they need O(1) field-name checks. This keeps field reordering independent from content migration.

### Keep the YAML source DTO envelope

Schema create and replace requests will still send `{ "schemaSource": "<yaml>" }` to the existing Content Type Service and API Gateway endpoints. The Management Frontend structured form will generate canonical YAML at submit time rather than sending a new structured DTO.

This avoids widening the API surface while still allowing the backend parser to remain the source of truth for schema validation.

### Model schema administration as structured drafts

The Management Frontend will use a local `SchemaDraft` model with `name`, `version`, and ordered `fields[]`. Create starts from a default draft. Replace initializes from the selected normalized schema. The UI mutates the ordered array for add/remove/rename/type/required/reorder operations, then serializes to canonical YAML for create or replace.

Validation failures preserve the draft state and display backend validation messages inline. A generated YAML preview may be shown for transparency, but it is not the primary editing surface.

## Risks / Trade-offs

- **Breaking schema response shape** -> Update all shared type consumers, tests, and API expectations in the same change.
- **Legacy YAML examples stop working** -> Update architecture docs, default schema snippets, seeds, and tests to the ordered sequence shape.
- **Lookup code gets slightly more verbose** -> Centralize simple helpers where repeated, such as converting `fields[]` to a `Map` for validation.
- **Frontend structured editor may diverge from backend parser rules** -> Keep backend validation authoritative and surface returned validation messages without clearing drafts.
- **Generated YAML formatting becomes part of UX expectations** -> Keep generated YAML minimal and deterministic: `name`, `version`, then fields in array order with `name`, `type`, and `required`.

## Migration Plan

1. Update shared schema types and initial generic schema to use ordered `fields[]`.
2. Update YAML parser tests and implementation to accept only ordered field sequences.
3. Update schema repositories, use cases, validation, CMIS projection, and frontend form helpers to iterate `fields[]`.
4. Replace schema administration textareas with structured draft forms and deterministic YAML generation.
5. Update affected OpenSpec examples, architecture snippets, unit tests, and Angular integration tests.
6. Run typecheck, lint, unit tests, and frontend integration tests.

Rollback is source-level only during this phase because schema persistence is in-memory and MongoDB schema storage remains deferred.
