## MODIFIED Requirements

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
