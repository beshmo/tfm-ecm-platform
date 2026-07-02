## ADDED Requirements

### Requirement: Administrators can browse schema folders in the frontend
The Management Frontend SHALL provide an administrator schema administration workspace rooted at `/system/schemas`.

#### Scenario: Open schema administration at schema root
- **WHEN** an administrator opens the content type schema administration route
- **THEN** the frontend loads `/system/schemas` folder context and displays schema subfolders and content type definitions in that folder

#### Scenario: Navigate schema subfolder
- **WHEN** an administrator selects a schema subfolder
- **THEN** the frontend displays that folder path and the schema subfolders and content type definitions assigned to that folder

#### Scenario: Display schema folder loading failure
- **WHEN** a schema folder or definition request fails
- **THEN** the frontend displays an inline error without leaving the schema administration workspace

### Requirement: Administrators can organize schemas in the frontend
The Management Frontend SHALL allow administrators to create schema subfolders and move content type definitions between schema folders under `/system/schemas`.

#### Scenario: Create schema folder from frontend
- **WHEN** an administrator submits a valid schema folder name under the selected schema folder
- **THEN** the frontend sends the create request through the gateway and refreshes the selected schema folder view

#### Scenario: Move content type definition from frontend
- **WHEN** an administrator chooses a target schema folder for a content type definition move
- **THEN** the frontend sends the move request through the gateway and refreshes the source and target schema folder views

#### Scenario: Display forbidden schema administration
- **WHEN** the backend rejects a schema administration request because the user is not an administrator
- **THEN** the frontend displays a forbidden message without clearing the current view state

## MODIFIED Requirements

### Requirement: Content type schema administration screen is available
The Management Frontend SHALL provide a content type schema administration screen for viewing and managing schema versions in folder context under `/system/schemas` through the API Gateway.

#### Scenario: Open schema administration route
- **WHEN** an administrator navigates to the content type schema administration route
- **THEN** the frontend requests schema folder context for `/system/schemas` and displays active schema summaries in that folder context

#### Scenario: View selected schema details
- **WHEN** an administrator selects an active schema summary or content type definition in the schema folder workspace
- **THEN** the frontend requests the schema definition through the gateway and displays the normalized schema name, version, active state, folder location, and fields in explicit schema field order

#### Scenario: Display schema list failure
- **WHEN** the schema summary or schema folder request fails
- **THEN** the frontend displays an inline error state without navigating away from the administration screen
