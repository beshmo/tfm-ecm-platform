## MODIFIED Requirements

### Requirement: Content editor uses content type schemas
The Management Frontend SHALL render content create and edit forms from content type schema definitions returned by the gateway, preserving the explicit field order from each schema.

#### Scenario: Choose content type for new content
- **WHEN** an author starts creating content
- **THEN** the frontend requests active content type summaries and lets the author choose one before rendering the schema fields

#### Scenario: Render latest schema fields
- **WHEN** an author chooses a content type for new content
- **THEN** the frontend retrieves the latest schema and renders one form control for each declared field in schema field order

#### Scenario: Render stored schema fields for editing
- **WHEN** an author edits an existing content record
- **THEN** the frontend retrieves that record's `contentType` and `schemaVersion` schema and renders the record data into matching fields in schema field order

#### Scenario: Enforce required fields before submit
- **WHEN** a schema field is marked `required`
- **THEN** the frontend prevents submission until the author provides a value for that field

### Requirement: Content type schema administration screen is available
The Management Frontend SHALL provide a content type schema administration screen for viewing active schema versions and managing schema version lifecycle through the API Gateway.

#### Scenario: Open schema administration route
- **WHEN** an administrator navigates to the content type schema administration route
- **THEN** the frontend requests `GET /api/management/content-types` and displays active schema summaries

#### Scenario: View selected schema details
- **WHEN** an administrator selects an active schema summary
- **THEN** the frontend requests the schema definition through the gateway and displays the normalized schema name, version, active state, and fields in explicit schema field order

#### Scenario: Display schema list failure
- **WHEN** the schema summary request fails
- **THEN** the frontend displays an inline error state without navigating away from the administration screen

### Requirement: Administrators can create schema versions from YAML
The Management Frontend SHALL allow administrators to create content type schema versions by completing a structured schema form that generates ordered YAML schema source for submission.

#### Scenario: Create schema version successfully
- **WHEN** an administrator completes a valid structured schema form for a new schema version and submits it
- **THEN** the frontend sends `POST /api/management/content-types` with `{ "schemaSource": "<generated ordered yaml>" }`, refreshes the schema list, and displays the returned normalized schema

#### Scenario: Add optional schema field
- **WHEN** an administrator adds a field in the create form and leaves it optional
- **THEN** the generated YAML includes the field in the draft field order with `required: false`

#### Scenario: Reorder create schema fields
- **WHEN** an administrator reorders fields in the create form
- **THEN** the generated YAML emits the `fields` sequence in the reordered draft order

#### Scenario: Show create validation feedback
- **WHEN** the backend rejects schema creation with validation messages
- **THEN** the frontend displays those validation messages inline and preserves the structured schema draft

#### Scenario: Show duplicate create conflict
- **WHEN** the backend rejects schema creation because the schema version already exists
- **THEN** the frontend displays the conflict message inline and preserves the structured schema draft

#### Scenario: Show oversized create failure
- **WHEN** the backend rejects schema creation because the generated YAML payload exceeds the configured maximum size
- **THEN** the frontend displays the oversized request message inline and preserves the structured schema draft

### Requirement: Administrators can replace active schema versions from YAML
The Management Frontend SHALL allow administrators to replace existing active content type schema versions by editing a structured schema form initialized from the selected schema and submitting generated ordered YAML source.

#### Scenario: Replace schema version successfully
- **WHEN** an administrator submits a valid structured replacement draft matching the selected schema `name + version`
- **THEN** the frontend sends `PUT /api/management/content-types/{name}/versions/{version}` with `{ "schemaSource": "<generated ordered yaml>" }`, refreshes the schema list, and displays the returned normalized schema

#### Scenario: Initialize replacement draft from selected schema
- **WHEN** an administrator selects a schema version for replacement
- **THEN** the replace form is populated with the selected schema name, version, and fields in explicit schema field order

#### Scenario: Reorder replacement schema fields
- **WHEN** an administrator reorders fields in the replace form
- **THEN** the generated replacement YAML emits the `fields` sequence in the reordered draft order

#### Scenario: Show replace validation feedback
- **WHEN** the backend rejects schema replacement with validation messages
- **THEN** the frontend displays those validation messages inline and preserves the structured replacement draft

#### Scenario: Show replacement conflict
- **WHEN** the backend rejects schema replacement because the schema identity differs or the version is inactive
- **THEN** the frontend displays the conflict message inline and preserves the structured replacement draft

#### Scenario: Show missing replacement target
- **WHEN** the backend rejects schema replacement because the selected schema version no longer exists
- **THEN** the frontend displays the not-found message inline and refreshes the schema list
