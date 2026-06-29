## Purpose

Content validation verifies content instance data against content type schemas before content is persisted or exposed through authoring workflows. This capability covers backend domain validation, schema reader use-case behavior, structured validation results, and deferred integration boundaries.

## Requirements

### Requirement: Validate content data shape

The system SHALL validate only plain JSON-like object content data.

#### Scenario: Plain object content data is accepted for field validation

- **WHEN** content data is a plain object
- **THEN** the validator evaluates the object fields against the schema

#### Scenario: Array content data is rejected

- **WHEN** content data is an array
- **THEN** validation returns an `INVALID_CONTENT_DATA` error

#### Scenario: Scalar content data is rejected

- **WHEN** content data is a scalar or `null`
- **THEN** validation returns an `INVALID_CONTENT_DATA` error

### Requirement: Validate required and optional fields

The system SHALL validate required and optional fields according to the content type schema.

#### Scenario: Valid content instance returns valid result

- **WHEN** all required fields are present and all present values match their declared types
- **THEN** validation returns `valid: true` with no errors

#### Scenario: Missing required field is rejected

- **WHEN** a required field key is absent
- **THEN** validation returns a `REQUIRED_FIELD_MISSING` error for that field

#### Scenario: Optional missing field is valid

- **WHEN** an optional field key is absent
- **THEN** validation does not return an error for that field

#### Scenario: Present null or undefined field is rejected

- **WHEN** a declared field key is present with `null` or `undefined`
- **THEN** validation returns the field type's validation error

#### Scenario: Empty required string is valid

- **WHEN** a required string field is present with an empty string
- **THEN** validation accepts the field value

### Requirement: Reject fields outside the schema

The system SHALL reject content data fields that are not declared by the content type schema.

#### Scenario: Unknown field is rejected

- **WHEN** content data contains a field not declared in the schema
- **THEN** validation returns an `UNKNOWN_FIELD` error for that field

### Requirement: Reject dangerous object keys

The system SHALL reject object keys that could cause prototype-pollution-like behavior.

#### Scenario: Prototype pollution key is rejected

- **WHEN** content data contains `__proto__`, `prototype`, or `constructor`
- **THEN** validation returns a `FORBIDDEN_FIELD_NAME` error for that field

### Requirement: Validate supported primitive field types

The system SHALL validate `string`, `integer`, `date`, and `time` field values without implicit coercion.

#### Scenario: String field accepts strings only

- **WHEN** a `string` field value is not a JavaScript string
- **THEN** validation returns an `INVALID_STRING` error

#### Scenario: Integer field accepts integer numbers only

- **WHEN** an `integer` field value is not a JavaScript number or is not `Number.isInteger(value)`
- **THEN** validation returns an `INVALID_INTEGER` error

#### Scenario: Date field accepts strict valid ISO calendar dates only

- **WHEN** a `date` field value is not a valid `YYYY-MM-DD` calendar date
- **THEN** validation returns an `INVALID_DATE` error

#### Scenario: Time field accepts strict time values only

- **WHEN** a `time` field value is not a valid `HH:mm:ss` time
- **THEN** validation returns an `INVALID_TIME` error

### Requirement: Return structured validation results

The system SHALL return structured validation results for normal content validation failures.

#### Scenario: Multiple validation errors are returned together

- **WHEN** content data contains multiple invalid fields
- **THEN** validation returns all detected validation errors in one result

#### Scenario: Validation error shape is normalized

- **WHEN** validation returns an error
- **THEN** each error contains `field`, `code`, and `message`

### Requirement: Resolve schema through application use case

The system SHALL validate content instances through an application use case that reads the appropriate content type schema.

#### Scenario: Latest active schema is used by default

- **WHEN** validation input omits `schemaVersion`
- **THEN** the use case reads the latest active schema for the requested content type

#### Scenario: Explicit schema version is used when provided

- **WHEN** validation input includes `schemaVersion`
- **THEN** the use case reads that schema version for the requested content type

#### Scenario: Missing schema throws application error

- **WHEN** the requested schema cannot be found
- **THEN** the use case throws a schema-not-found application error

### Requirement: Keep integration deferred

The system SHALL keep this slice limited to shared types, domain validation, application use case logic, and in-memory test infrastructure.

#### Scenario: REST endpoints are not added

- **WHEN** this change is implemented
- **THEN** no content validation REST endpoint or content CRUD endpoint is introduced

#### Scenario: Persistence is not added

- **WHEN** this change is implemented
- **THEN** no MongoDB repository, collection migration, or database integration is introduced

#### Scenario: Frontend and gateway wiring are not added

- **WHEN** this change is implemented
- **THEN** no Angular UI or API Gateway route is introduced
