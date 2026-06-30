## ADDED Requirements

### Requirement: Content type schema administration screen is available
The Management Frontend SHALL provide a content type schema administration screen for viewing active schema versions and managing schema version lifecycle through the API Gateway.

#### Scenario: Open schema administration route
- **WHEN** an administrator navigates to the content type schema administration route
- **THEN** the frontend requests `GET /api/management/content-types` and displays active schema summaries

#### Scenario: View selected schema details
- **WHEN** an administrator selects an active schema summary
- **THEN** the frontend requests the schema definition through the gateway and displays the normalized schema name, version, active state, and fields

#### Scenario: Display schema list failure
- **WHEN** the schema summary request fails
- **THEN** the frontend displays an inline error state without navigating away from the administration screen

### Requirement: Administrators can create schema versions from YAML
The Management Frontend SHALL allow administrators to create content type schema versions by submitting YAML source text through a textarea.

#### Scenario: Create schema version successfully
- **WHEN** an administrator submits valid YAML source text for a new schema version
- **THEN** the frontend sends `POST /api/management/content-types` with `{ "schemaSource": "<yaml>" }`, refreshes the schema list, and displays the returned normalized schema

#### Scenario: Show create validation feedback
- **WHEN** the backend rejects schema creation with validation messages
- **THEN** the frontend displays those validation messages inline and preserves the YAML textarea contents

#### Scenario: Show duplicate create conflict
- **WHEN** the backend rejects schema creation because the schema version already exists
- **THEN** the frontend displays the conflict message inline and preserves the YAML textarea contents

#### Scenario: Show oversized create failure
- **WHEN** the backend rejects schema creation because the YAML payload exceeds the configured maximum size
- **THEN** the frontend displays the oversized request message inline and preserves the YAML textarea contents

### Requirement: Administrators can replace active schema versions from YAML
The Management Frontend SHALL allow administrators to replace existing active content type schema versions by submitting YAML source text through a textarea.

#### Scenario: Replace schema version successfully
- **WHEN** an administrator submits valid YAML source text matching the selected schema `name + version`
- **THEN** the frontend sends `PUT /api/management/content-types/{name}/versions/{version}` with `{ "schemaSource": "<yaml>" }`, refreshes the schema list, and displays the returned normalized schema

#### Scenario: Show replace validation feedback
- **WHEN** the backend rejects schema replacement with validation messages
- **THEN** the frontend displays those validation messages inline and preserves the YAML textarea contents

#### Scenario: Show replacement conflict
- **WHEN** the backend rejects schema replacement because the schema identity differs or the version is inactive
- **THEN** the frontend displays the conflict message inline and preserves the YAML textarea contents

#### Scenario: Show missing replacement target
- **WHEN** the backend rejects schema replacement because the selected schema version no longer exists
- **THEN** the frontend displays the not-found message inline and refreshes the schema list

### Requirement: Administrators can deactivate schema versions
The Management Frontend SHALL allow administrators to deactivate existing schema versions after confirmation.

#### Scenario: Deactivate schema version successfully
- **WHEN** an administrator confirms deactivation for a schema version
- **THEN** the frontend sends `DELETE /api/management/content-types/{name}/versions/{version}`, refreshes the active schema list, and removes the deactivated version from active summaries

#### Scenario: Cancel schema deactivation
- **WHEN** an administrator cancels a deactivation confirmation
- **THEN** the frontend does not send a delete request and leaves the schema list unchanged

#### Scenario: Show deactivate not found
- **WHEN** the backend reports that the schema version no longer exists during deactivation
- **THEN** the frontend displays the not-found message inline and refreshes the schema list

### Requirement: Content type schema API client supports write operations
The Management Frontend SHALL include content type schema API client methods for create, replace, and deactivate operations through relative API Gateway URLs.

#### Scenario: Create schema client request
- **WHEN** the frontend creates a schema version
- **THEN** the API client calls `POST /api/management/content-types` with the YAML source DTO

#### Scenario: Replace schema client request encodes identifiers
- **WHEN** the frontend replaces a schema version with dynamic name or version values
- **THEN** the API client URL-encodes the name and version segments before calling the gateway

#### Scenario: Deactivate schema client request encodes identifiers
- **WHEN** the frontend deactivates a schema version with dynamic name or version values
- **THEN** the API client URL-encodes the name and version segments before calling the gateway

#### Scenario: Schema write errors are normalized
- **WHEN** Angular HTTP failures represent validation, conflict, not-found, oversized payload, or service failures
- **THEN** the API client exposes normalized API client errors and structured validation messages where provided
