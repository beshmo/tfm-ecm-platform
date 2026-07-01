## Why

Schema administrators currently create and replace content type schemas by editing raw YAML textareas, which makes common schema authoring actions such as adding optional fields and reordering fields unnecessarily error-prone. Field order is also only implicit in YAML/object insertion order, so the frontend cannot treat reordering as a durable schema operation.

## What Changes

- **BREAKING**: Change the normalized `ContentTypeSchemaDefinition.fields` contract from a field-name keyed object to an ordered `ContentTypeSchemaField[]` array.
- **BREAKING**: Change author-facing schema YAML so `fields` is an ordered sequence of field objects with `name`, `type`, and `required` properties.
- Reject legacy field mapping YAML and duplicate field names with structured schema validation feedback.
- Replace schema create and replace textareas in the Management Frontend with structured schema forms that support field add, rename, type selection, required/optional toggling, removal, and reordering.
- Preserve structured schema draft state and inline validation feedback when schema create or replace fails.
- Render schema-driven content forms and schema details using the explicit field order returned by the gateway.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-type-schemas`: Normalize schemas with explicit ordered fields and parse only the clean-break ordered YAML shape.
- `management-content-authoring`: Replace raw YAML schema administration textareas with structured ordered-field forms and render schema fields in explicit order.

## Impact

- Shared contracts in `packages/shared-types` and YAML parsing in `packages/shared-yaml`.
- Content Type Service schema create, replace, clone, list, and read behavior.
- Content Service schema validation and schema-driven content form helpers.
- Management Frontend schema administration and folder explorer form rendering.
- API responses for content type schema definitions returned through the API Gateway.
- Unit and integration tests that assert schema field shape, YAML parsing behavior, and schema administration workflows.
