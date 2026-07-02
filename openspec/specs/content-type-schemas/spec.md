## Purpose

Content type schemas define author-facing YAML schema definitions for user-defined content types. This capability covers parsing, normalization, validation, version lifecycle, and backend domain/application use cases for schema management.

## Requirements

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

- **WHEN** a field type is not `string`, `integer`, `date`, `time`, `boolean`, `datetime`, `decimal`, `html`, or `uri`
- **THEN** validation fails with schema validation issues

#### Scenario: Supported field types are accepted

- **WHEN** field entries use only `string`, `integer`, `date`, `time`, `boolean`, `datetime`, `decimal`, `html`, or `uri`
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

### Requirement: Reserve internal platform type names

The system SHALL prevent user-defined content type schemas from using names reserved for internal platform types.

#### Scenario: Folder type name is rejected

- **WHEN** a schema name attempts to define `folder` or `folders`
- **THEN** validation fails because folder is an internal platform type

#### Scenario: Document compatibility type name is rejected

- **WHEN** a schema name attempts to define `static-file`, `static-files`, `file`, or `files`
- **THEN** validation fails because document is an internal platform type and those names are reserved compatibility aliases

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

### Requirement: Content Service owns schema management runtime
The system SHALL expose content type schema management from the Content Service runtime while preserving the existing content type schema API behavior.

#### Scenario: Content Service lists active schemas
- **WHEN** a valid `GET /api/management/content-types` request is handled after this change
- **THEN** the Content Service returns active content type schema summaries with the same response shape as the previous content type schema API

#### Scenario: Content Service retrieves schema version
- **WHEN** a valid `GET /api/management/content-types/{name}/versions/{version}` request retrieves an existing schema version
- **THEN** the Content Service returns that normalized schema definition with fields in explicit schema order

#### Scenario: Content Service writes schema versions
- **WHEN** valid schema create, replace, or deactivate requests are handled after this change
- **THEN** the Content Service applies the existing YAML parsing, version lifecycle, conflict, not-found, and validation error behavior

### Requirement: Schema definitions expose folder location
The system SHALL expose enough metadata for administrators to understand and change the folder location of content type definitions under `/system/schemas`.

#### Scenario: Administrative schema list by folder
- **WHEN** an administrator lists content type definitions for a schema folder
- **THEN** the system returns only definitions assigned to that folder with their active version summary information

#### Scenario: Existing active summary behavior remains available
- **WHEN** a content authoring workflow lists active content type schemas without a folder filter
- **THEN** the system returns active schema summaries suitable for choosing a content type without requiring schema folder navigation

### Requirement: Content type schema read REST API is exposed
The system SHALL expose read-only Content Service management endpoints for listing active schemas and retrieving ordered schema definitions.

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

### Requirement: Content type schema reads are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/content-types` to the Content Service.

#### Scenario: Gateway forwards schema list
- **WHEN** the API Gateway receives `GET /api/management/content-types`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway forwards schema detail
- **WHEN** the API Gateway receives `GET /api/management/content-types/{name}` or `GET /api/management/content-types/{name}/versions/{version}`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

### Requirement: Content type schema write REST API is exposed
The system SHALL expose Content Service management endpoints for creating, replacing, and soft deactivating content type schema versions.

#### Scenario: Create schema version endpoint
- **WHEN** a valid `POST /api/management/content-types` request sends YAML schema source for a new `name + version`
- **THEN** the system responds with status `201`, stores the schema version, and returns the normalized schema definition

#### Scenario: Replace schema version endpoint
- **WHEN** a valid `PUT /api/management/content-types/{name}/versions/{version}` request sends YAML schema source matching the requested schema identity
- **THEN** the system responds with status `200`, replaces the active schema version, and returns the normalized schema definition

#### Scenario: Deactivate schema version endpoint
- **WHEN** a valid `DELETE /api/management/content-types/{name}/versions/{version}` request targets an existing schema version
- **THEN** the system soft deactivates the schema version and responds with status `204`

#### Scenario: Deactivated version remains explicitly retrievable
- **WHEN** a deactivated schema version is requested through `GET /api/management/content-types/{name}/versions/{version}`
- **THEN** the system responds with status `200` and the normalized schema definition for that inactive version

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

### Requirement: Content type schema writes are routed through the gateway
The system SHALL route API Gateway write requests under `/api/management/content-types` to the Content Service.

#### Scenario: Gateway forwards schema create
- **WHEN** the API Gateway receives `POST /api/management/content-types` with a JSON schema source DTO
- **THEN** it forwards the request to the Content Service and returns the downstream status and response body

#### Scenario: Gateway forwards schema replace
- **WHEN** the API Gateway receives `PUT /api/management/content-types/{name}/versions/{version}` with a JSON schema source DTO
- **THEN** it forwards the method, path, and request body to the Content Service

#### Scenario: Gateway forwards schema deactivate
- **WHEN** the API Gateway receives `DELETE /api/management/content-types/{name}/versions/{version}`
- **THEN** it forwards the method and path to the Content Service and returns the downstream status

### Requirement: YAML schema payload size is configurable
The system SHALL enforce a configurable maximum size for author-facing YAML schema source text used in production management requests.

#### Scenario: Default YAML source size limit is applied
- **WHEN** no explicit YAML schema size configuration is provided
- **THEN** the system uses a safe default maximum of `65536` bytes for schema source text

#### Scenario: Configured YAML source size limit is applied
- **WHEN** the runtime config sets a maximum YAML schema source size
- **THEN** schema create and replace requests use that configured limit before YAML parsing

#### Scenario: Oversized schema request is rejected
- **WHEN** a schema create or replace request sends `schemaSource` larger than the configured maximum
- **THEN** the system responds with status `413` without parsing or storing the schema

#### Scenario: Parser retains size defense
- **WHEN** schema source larger than the configured parser limit is parsed outside the HTTP request path
- **THEN** the parser rejects the input with a sanitized schema validation error before parsing YAML

### Requirement: Durable schema persistence remains deferred
The system SHALL keep MongoDB-backed content type schema persistence deferred while exposing schema management through the existing in-memory repository for this phase.

#### Scenario: MongoDB persistence is not introduced
- **WHEN** this change is implemented
- **THEN** no MongoDB repository, collection migration, or database integration is introduced for content type schemas
