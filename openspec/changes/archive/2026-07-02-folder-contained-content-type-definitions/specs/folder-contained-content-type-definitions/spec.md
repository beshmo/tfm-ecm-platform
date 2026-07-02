## ADDED Requirements

### Requirement: Content type definitions are folder-contained repository objects
The system SHALL represent each user content type definition as a repository object assigned to a folder under `/system/schemas`.

#### Scenario: Create content type definition in schema folder
- **WHEN** an administrator creates a valid content type schema version with a target schema folder under `/system/schemas`
- **THEN** the system stores the content type definition as a folder-contained object in that schema folder and stores the submitted schema version under that definition

#### Scenario: Versions remain grouped by content type definition
- **WHEN** multiple versions exist for the same content type name
- **THEN** the versions are associated with the same folder-contained content type definition object

#### Scenario: Reject schema outside schema namespace
- **WHEN** an administrator attempts to create or move a content type definition outside `/system/schemas`
- **THEN** the system rejects the operation as a conflict

### Requirement: Administrators can organize schema folders
The system SHALL allow administrators to create, rename, move, and delete schema subfolders within `/system/schemas` subject to protected namespace and emptiness rules.

#### Scenario: Create schema subfolder
- **WHEN** an administrator creates a folder under `/system/schemas`
- **THEN** the system creates a schema folder whose path is below `/system/schemas`

#### Scenario: Move schema subfolder within schema namespace
- **WHEN** an administrator moves an empty or non-empty schema subfolder to another valid parent under `/system/schemas`
- **THEN** the system updates that folder path and descendant paths without moving the folder outside `/system/schemas`

#### Scenario: Reject schema folder delete when containing definitions
- **WHEN** an administrator deletes a schema folder that contains one or more content type definition objects
- **THEN** the system rejects the delete as a non-empty folder conflict

### Requirement: Administrators can move content type definitions
The system SHALL allow administrators to move a content type definition object between schema folders under `/system/schemas` without changing its schema name or versions.

#### Scenario: Move content type definition
- **WHEN** an administrator moves a content type definition from one schema folder to another schema folder under `/system/schemas`
- **THEN** the system updates the definition location and keeps all schema versions retrievable by their original name and version

#### Scenario: Reject move to missing schema folder
- **WHEN** an administrator moves a content type definition to a folder that does not exist
- **THEN** the system rejects the operation because the target folder was not found

#### Scenario: Reject moving missing definition
- **WHEN** an administrator moves a content type definition that does not exist
- **THEN** the system responds that the content type definition was not found

### Requirement: Schema administration is admin-only
The system SHALL require administrator authorization for schema folder browsing and all content type definition administration operations.

#### Scenario: Admin can browse schema namespace
- **WHEN** an authenticated administrator lists schema folders and content type definitions under `/system/schemas`
- **THEN** the system returns the schema folders and content type definition objects visible in that namespace

#### Scenario: Non-admin schema administration is forbidden
- **WHEN** an authenticated non-admin attempts to create, replace, deactivate, move, or organize content type definitions or schema folders
- **THEN** the system rejects the operation as forbidden
