## MODIFIED Requirements

### Requirement: Folder deletion only removes empty user folders
The system SHALL delete only non-root folders that have no child folders and no assigned content according to the content repository occupancy signal.

#### Scenario: Delete empty folder
- **WHEN** a user deletes a non-root folder with no child folders and no assigned content
- **THEN** the system removes the folder and returns a successful empty response

#### Scenario: Reject folder with child folders
- **WHEN** a user deletes a folder that has child folders
- **THEN** the system rejects the operation as a non-empty folder conflict

#### Scenario: Reject folder with assigned content
- **WHEN** a user deletes a folder that has assigned content reported by the content repository
- **THEN** the system rejects the operation as a non-empty folder conflict
