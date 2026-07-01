## MODIFIED Requirements

### Requirement: Parse author-facing YAML schemas

The system SHALL parse author-facing YAML content type schema text into a normalized JSON-compatible schema definition with explicit field order.

#### Scenario: Valid ordered YAML schema is normalized

- **WHEN** a YAML schema defines `name`, `version`, and `fields` as an ordered sequence of field objects
- **THEN** the parser returns a normalized schema definition containing the schema name, version, and `fields` as an ordered array in the same order as the YAML sequence

#### Scenario: Field names are normalized into field entries

- **WHEN** a YAML field entry defines `name`, `type`, and `required`
- **THEN** the normalized schema field entry contains that `name`, `type`, and `required` value

#### Scenario: Optional required flag defaults to false

- **WHEN** a field entry omits `required`
- **THEN** the normalized field entry sets `required` to `false`

#### Scenario: Invalid YAML is rejected safely

- **WHEN** schema text is not valid YAML
- **THEN** the parser rejects it with a validation error that does not expose stack traces, filesystem paths, or internal parser details

### Requirement: Validate schema shape and supported field types

The system SHALL validate content type schema definitions with allowlisted schema keys, field entry keys, unique field names, and field types.

#### Scenario: Missing required top-level keys are rejected

- **WHEN** a schema omits `name`, `version`, or `fields`
- **THEN** validation fails with schema validation issues

#### Scenario: Unknown top-level keys are rejected

- **WHEN** a schema includes a top-level key other than `name`, `version`, or `fields`
- **THEN** validation fails with schema validation issues

#### Scenario: Legacy field mappings are rejected

- **WHEN** a schema defines `fields` as a mapping instead of an ordered sequence
- **THEN** validation fails with a schema validation issue explaining that fields must be an ordered sequence

#### Scenario: Field entries require names

- **WHEN** a field entry omits `name` or provides a non-string name
- **THEN** validation fails with schema validation issues

#### Scenario: Duplicate field names are rejected

- **WHEN** more than one field entry uses the same field name
- **THEN** validation fails with schema validation issues

#### Scenario: Unknown field entry keys are rejected

- **WHEN** a field entry includes a key other than `name`, `type`, or `required`
- **THEN** validation fails with schema validation issues

#### Scenario: Unsupported field type is rejected

- **WHEN** a field type is not `string`, `integer`, `date`, or `time`
- **THEN** validation fails with schema validation issues

#### Scenario: Supported field types are accepted

- **WHEN** field entries use only `string`, `integer`, `date`, and `time`
- **THEN** validation succeeds for those field types

### Requirement: Protect schema input handling

The system SHALL reject unsafe or ambiguous schema input before storing a content type schema.

#### Scenario: Oversized YAML input is rejected

- **WHEN** schema text exceeds the configured maximum length
- **THEN** the parser rejects it with a validation error

#### Scenario: Prototype pollution keys are rejected

- **WHEN** schema text contains keys such as `__proto__`, `prototype`, or `constructor`
- **THEN** validation fails with schema validation issues

#### Scenario: Unsafe field names are rejected

- **WHEN** a field entry name is empty, not identifier-like, or uses a blocked unsafe key
- **THEN** validation fails with schema validation issues

#### Scenario: Ambiguous YAML features are rejected

- **WHEN** schema text uses unsupported YAML aliases, anchors, or ambiguous shapes
- **THEN** the parser rejects the schema instead of silently coercing it

### Requirement: Create schema versions

The system SHALL create content type schema versions from valid ordered YAML schema text through an application use case.

#### Scenario: New schema version is stored

- **WHEN** valid ordered YAML schema text defines a new `name + version`
- **THEN** the create use case stores it and returns the normalized schema definition with fields in the YAML sequence order

#### Scenario: Duplicate schema version is rejected

- **WHEN** a schema with the same `name + version` already exists
- **THEN** the create use case rejects the duplicate

### Requirement: Replace active schema versions

The system SHALL replace an existing active schema version when the requested name and version match the ordered YAML content.

#### Scenario: Existing active schema version is replaced

- **WHEN** an active schema version exists and replacement YAML has the same `name` and `version`
- **THEN** the replace use case stores and returns the replacement definition with fields in the replacement YAML sequence order

#### Scenario: Mismatched replacement identity is rejected

- **WHEN** replacement YAML has a different `name` or `version` than the requested schema identity
- **THEN** the replace use case rejects the replacement

#### Scenario: Inactive schema version is not replaced

- **WHEN** the requested schema version is inactive
- **THEN** the replace use case rejects the replacement

### Requirement: Content type schema read REST API is exposed
The system SHALL expose read-only Content Type Service management endpoints for listing active schemas and retrieving ordered schema definitions.

#### Scenario: List active schemas endpoint
- **WHEN** a valid `GET /api/management/content-types` request is made
- **THEN** the system responds with status `200` and active content type schema summaries

#### Scenario: Retrieve latest schema endpoint
- **WHEN** a valid `GET /api/management/content-types/{name}` request retrieves an existing active content type
- **THEN** the system responds with status `200` and the latest active schema definition with fields in explicit schema order

#### Scenario: Retrieve explicit schema version endpoint
- **WHEN** a valid `GET /api/management/content-types/{name}/versions/{version}` request retrieves an existing schema version
- **THEN** the system responds with status `200` and that schema definition with fields in explicit schema order

#### Scenario: Map missing schema read
- **WHEN** a content type schema read request targets a missing schema
- **THEN** the system responds with status `404`

### Requirement: Schema write requests use YAML source DTOs
The system SHALL accept schema create and replace requests as JSON DTOs containing author-facing ordered YAML schema source text.

#### Scenario: JSON envelope carries YAML source
- **WHEN** a schema create or replace request sends `{ "schemaSource": "<yaml>" }`
- **THEN** the system parses `schemaSource` as ordered YAML and applies schema validation rules before storing the normalized definition

#### Scenario: Missing schema source is rejected
- **WHEN** a schema create or replace request omits `schemaSource` or sends a non-string value
- **THEN** the system responds with status `400` and a sanitized validation message

#### Scenario: Invalid YAML returns structured validation feedback
- **WHEN** a schema create or replace request sends invalid YAML or a schema that violates schema validation rules
- **THEN** the system responds with status `400`, a sanitized error message, and validation messages suitable for display in the Management Frontend

#### Scenario: Duplicate schema create is rejected
- **WHEN** a schema create request targets a `name + version` that already exists
- **THEN** the system responds with status `409`

#### Scenario: Replacement identity mismatch is rejected
- **WHEN** a schema replace request sends YAML with a different `name` or `version` than the requested path
- **THEN** the system responds with status `409`

#### Scenario: Inactive schema replacement is rejected
- **WHEN** a schema replace request targets an inactive schema version
- **THEN** the system responds with status `409`

#### Scenario: Missing schema write target is rejected
- **WHEN** a schema replace or deactivate request targets a missing schema version
- **THEN** the system responds with status `404`
