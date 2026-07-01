## Why

ECMP content schemas currently support only `string`, `integer`, `date`, and `time`, which blocks common editorial and integration use cases such as booleans, timezone-aware publication moments, decimal measurements, formatted body text, and links. Adding these field types now keeps schema-driven authoring extensible without introducing one-off content model workarounds.

## What Changes

- Add support for `boolean`, `datetime`, `decimal`, `html`, and `uri` content field types in the shared schema contract.
- Allow those field types in author-facing YAML content type schemas.
- Validate content instance values for the new field types without implicit backend coercion.
- Render and submit appropriate Management Frontend controls and values for the new field types.
- Project the new field types through the CMIS compatibility surface where CMIS has matching property types, and use conservative string mappings where it does not.
- Document security handling for HTML-formatted text so stored HTML does not create an unsafe rendering path.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-type-schemas`: expand the schema field type allowlist and normalized schema contract.
- `content-validation`: define validation behavior and error reporting for the new field types.
- `management-content-authoring`: support schema administration and content editing workflows for the new field types.
- `cmis-browser-binding`: expose supported new schema field types as CMIS property definitions and object properties.

## Impact

- Shared contracts in `packages/shared-types`.
- YAML schema parsing in `packages/shared-yaml`.
- Content validation domain and tests in `services/content-service`.
- Content Type Service tests and any schema examples seeded through shared types.
- Angular schema administration and folder explorer content editor controls.
- CMIS type and object projection helpers plus CMIS adapter tests.
- Architecture/spec documentation describing field type semantics and security expectations.
