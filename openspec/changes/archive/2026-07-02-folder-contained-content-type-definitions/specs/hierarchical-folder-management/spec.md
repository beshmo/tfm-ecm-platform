## ADDED Requirements

### Requirement: System schema folders exist
The system SHALL provide reserved `/system` and `/system/schemas` folders in addition to the root folder.

#### Scenario: Retrieve system folder
- **WHEN** the `/system` folder is retrieved or listed
- **THEN** the system returns a folder with path `/system` whose parent is the root folder

#### Scenario: Retrieve system schemas folder
- **WHEN** the `/system/schemas` folder is retrieved or listed
- **THEN** the system returns a folder with path `/system/schemas` whose parent is the `/system` folder

### Requirement: Protected system folders cannot be modified
The system SHALL reject rename, move, and delete operations for `/system` and `/system/schemas`.

#### Scenario: Reject system folder rename
- **WHEN** a user attempts to rename `/system` or `/system/schemas`
- **THEN** the system rejects the operation as a conflict

#### Scenario: Reject system folder delete
- **WHEN** a user attempts to delete `/system` or `/system/schemas`
- **THEN** the system rejects the operation as a conflict

#### Scenario: Reject system folder move
- **WHEN** a user attempts to move `/system` or `/system/schemas`
- **THEN** the system rejects the operation as a conflict

### Requirement: System schema namespace restricts normal content
The system SHALL reject normal content record and document creation under `/system` and `/system/schemas` descendants.

#### Scenario: Reject content record in system namespace
- **WHEN** a user creates a content record in `/system`, `/system/schemas`, or a descendant schema folder
- **THEN** the system rejects the operation as a conflict

#### Scenario: Reject document in system namespace
- **WHEN** a user uploads a document in `/system`, `/system/schemas`, or a descendant schema folder
- **THEN** the system rejects the operation as a conflict

### Requirement: Folder occupancy includes content type definitions
The system SHALL treat content type definition objects as assigned folder contents when deciding whether a folder is empty.

#### Scenario: Reject deleting folder with content type definitions
- **WHEN** a user deletes a non-protected schema folder that contains a content type definition object
- **THEN** the system rejects the operation as a non-empty folder conflict
