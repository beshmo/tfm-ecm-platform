## ADDED Requirements

### Requirement: Content editor supports extended schema field types
The Management Frontend SHALL render and submit schema-driven content fields for `boolean`, `datetime`, `decimal`, `html`, and `uri` without losing the backend-required value shape.

#### Scenario: Boolean field submits boolean value
- **WHEN** an author edits a `boolean` field
- **THEN** the frontend submits the field value as a JSON boolean in content `data`

#### Scenario: Datetime field preserves timezone text
- **WHEN** an author edits a `datetime` field
- **THEN** the frontend submits the timestamp string including its explicit timezone designator

#### Scenario: Decimal field submits numeric value
- **WHEN** an author edits a `decimal` field
- **THEN** the frontend submits a JSON number for non-empty decimal input

#### Scenario: HTML field submits formatted text source
- **WHEN** an author edits an `html` field
- **THEN** the frontend submits the entered HTML-formatted text as a string without rendering it as trusted markup in the editor

#### Scenario: URI field submits URI text
- **WHEN** an author edits a `uri` field
- **THEN** the frontend submits the entered URI value as a string for backend validation

### Requirement: Schema administration supports extended field type selection
The Management Frontend SHALL allow administrators to create and replace content type schema fields using `boolean`, `datetime`, `decimal`, `html`, and `uri`.

#### Scenario: Create schema YAML includes selected extended field type
- **WHEN** an administrator selects one of the extended field types in the create schema form
- **THEN** the generated ordered YAML includes that field type for the matching field entry

#### Scenario: Replacement draft preserves extended field type
- **WHEN** an administrator selects an existing schema containing an extended field type
- **THEN** the replacement draft displays that field type and emits it unchanged unless the administrator changes it
