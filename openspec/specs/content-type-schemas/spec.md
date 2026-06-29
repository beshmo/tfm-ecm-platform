## Purpose

Content type schemas define author-facing YAML schema definitions for user-defined content types. This capability covers parsing, normalization, validation, version lifecycle, and backend domain/application use cases for schema management.

## Requirements

### Requirement: Parse author-facing YAML schemas

The system SHALL parse author-facing YAML content type schema text into a normalized JSON-compatible schema definition.

#### Scenario: Valid YAML schema is normalized

- **WHEN** a YAML schema defines `name`, `version`, and supported `fields`
- **THEN** the parser returns a normalized schema definition containing the schema name, version, and field definitions

#### Scenario: Optional required flag defaults to false

- **WHEN** a field omits `required`
- **THEN** the normalized field definition sets `required` to `false`

#### Scenario: Invalid YAML is rejected safely

- **WHEN** schema text is not valid YAML
- **THEN** the parser rejects it with a validation error that does not expose stack traces, filesystem paths, or internal parser details

### Requirement: Validate schema shape and supported field types

The system SHALL validate content type schema definitions with allowlisted schema keys, field keys, and field types.

#### Scenario: Missing required top-level keys are rejected

- **WHEN** a schema omits `name`, `version`, or `fields`
- **THEN** validation fails with schema validation issues

#### Scenario: Unknown top-level keys are rejected

- **WHEN** a schema includes a top-level key other than `name`, `version`, or `fields`
- **THEN** validation fails with schema validation issues

#### Scenario: Unsupported field type is rejected

- **WHEN** a field type is not `string`, `integer`, `date`, or `time`
- **THEN** validation fails with schema validation issues

#### Scenario: Supported field types are accepted

- **WHEN** fields use only `string`, `integer`, `date`, and `time`
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

- **WHEN** a field name is empty, not identifier-like, or uses a blocked unsafe key
- **THEN** validation fails with schema validation issues

#### Scenario: Ambiguous YAML features are rejected

- **WHEN** schema text uses unsupported YAML aliases, anchors, or ambiguous shapes
- **THEN** the parser rejects the schema instead of silently coercing it

### Requirement: Reserve internal platform type names

The system SHALL prevent user-defined content type schemas from using names reserved for internal platform types.

#### Scenario: Folder type name is rejected

- **WHEN** a schema name attempts to define `folder` or `folders`
- **THEN** validation fails because folder is an internal platform type

#### Scenario: Static file type name is rejected

- **WHEN** a schema name attempts to define `static-file`, `static-files`, `file`, or `files`
- **THEN** validation fails because static file is an internal platform type

### Requirement: Create schema versions

The system SHALL create content type schema versions from valid YAML schema text through an application use case.

#### Scenario: New schema version is stored

- **WHEN** valid YAML schema text defines a new `name + version`
- **THEN** the create use case stores it and returns the normalized schema definition

#### Scenario: Duplicate schema version is rejected

- **WHEN** a schema with the same `name + version` already exists
- **THEN** the create use case rejects the duplicate

### Requirement: Replace active schema versions

The system SHALL replace an existing active schema version when the requested name and version match the YAML content.

#### Scenario: Existing active schema version is replaced

- **WHEN** an active schema version exists and replacement YAML has the same `name` and `version`
- **THEN** the replace use case stores and returns the replacement definition

#### Scenario: Mismatched replacement identity is rejected

- **WHEN** replacement YAML has a different `name` or `version` than the requested schema identity
- **THEN** the replace use case rejects the replacement

#### Scenario: Inactive schema version is not replaced

- **WHEN** the requested schema version is inactive
- **THEN** the replace use case rejects the replacement

### Requirement: Retrieve and list schema versions

The system SHALL retrieve content type schemas by latest active version, by explicit version, and as active schema summaries.

#### Scenario: Latest lookup returns active version

- **WHEN** a content type has active and inactive schema versions
- **THEN** latest lookup returns the highest active version only

#### Scenario: Explicit lookup includes inactive version

- **WHEN** a specific inactive schema version is requested by `name + version`
- **THEN** the get version use case returns that schema definition

#### Scenario: List returns active summaries

- **WHEN** schemas are listed
- **THEN** the list use case returns summaries for active schema versions only

### Requirement: Soft deactivate schema versions

The system SHALL soft deactivate schema versions instead of physically deleting them.

#### Scenario: Schema version is deactivated

- **WHEN** an existing schema version is deactivated
- **THEN** it is marked inactive and remains retrievable by explicit version

#### Scenario: Deactivated version is excluded from active lookups

- **WHEN** a schema version has been deactivated
- **THEN** latest lookup and active listing exclude that version

### Requirement: Keep presentation and persistence deferred

The system SHALL keep this slice limited to domain, application, shared parsing/types, and in-memory infrastructure.

#### Scenario: REST endpoints are not added

- **WHEN** this change is implemented
- **THEN** no content type REST CRUD endpoints or API Gateway routes are introduced

#### Scenario: MongoDB persistence is not added

- **WHEN** this change is implemented
- **THEN** no MongoDB repository, collection migration, or database integration is introduced

#### Scenario: Angular UI is not added

- **WHEN** this change is implemented
- **THEN** no Angular content type schema screens are introduced
