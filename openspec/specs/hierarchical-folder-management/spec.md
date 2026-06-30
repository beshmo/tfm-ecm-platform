## Purpose

Define the backend folder hierarchy capability used by the Content Service to organize content records in Phase 3.

## Requirements

### Requirement: Root folder exists
The system SHALL provide a reserved root folder with `folderId` `FLD-root`, path `/`, no parent folder, and immutable root identity.

#### Scenario: Retrieve root folder
- **WHEN** a folder is retrieved with folder ID `FLD-root`
- **THEN** the system returns the root folder with path `/` and `parentFolderId` `null`

#### Scenario: Reject root rename
- **WHEN** a user attempts to rename `FLD-root`
- **THEN** the system rejects the operation as a conflict

#### Scenario: Reject root delete
- **WHEN** a user attempts to delete `FLD-root`
- **THEN** the system rejects the operation as a conflict

### Requirement: Folder names are validated
The system SHALL require user-created folder names to be trimmed, non-empty, not `.`, not `..`, free of path separators, free of control characters, and free of common unsafe filesystem symbols `<`, `>`, `:`, `"`, `|`, `?`, and `*`.

#### Scenario: Create folder with normalized valid name
- **WHEN** a user creates a folder with surrounding whitespace in the name
- **THEN** the system stores the folder using the trimmed folder name

#### Scenario: Reject invalid folder name
- **WHEN** a user creates or renames a folder with an invalid name
- **THEN** the system rejects the request as malformed input

### Requirement: Folders form a hierarchy
The system SHALL create user folders under an existing parent folder and derive each folder path from its parent path and folder name.

#### Scenario: Create child folder under root
- **WHEN** a user creates folder `folder1` with parent folder ID `FLD-root`
- **THEN** the system creates a folder with a generated `FLD-` ID, parent folder ID `FLD-root`, and path `/folder1`

#### Scenario: Create nested child folder
- **WHEN** a user creates folder `folder2` under an existing folder with path `/folder1`
- **THEN** the system creates the child folder with path `/folder1/folder2`

#### Scenario: Reject missing parent
- **WHEN** a user creates a folder with a parent folder ID that does not exist
- **THEN** the system rejects the request because the parent folder was not found

### Requirement: Sibling folder names are unique
The system SHALL prevent two folders with the same case-insensitive name from existing under the same parent folder.

#### Scenario: Reject duplicate sibling on create
- **WHEN** a user creates a folder with the same name as an existing sibling using different letter casing
- **THEN** the system rejects the operation as a duplicate sibling name conflict

#### Scenario: Allow same name under different parents
- **WHEN** a user creates folders with the same name under different parent folders
- **THEN** the system allows both folders

#### Scenario: Reject duplicate sibling on rename
- **WHEN** a user renames a folder to the same case-insensitive name as an existing sibling
- **THEN** the system rejects the operation as a duplicate sibling name conflict

### Requirement: Folder listing and retrieval are available
The system SHALL expose folder retrieval and listing through management APIs.

#### Scenario: List all folders
- **WHEN** a user lists folders without a parent folder filter
- **THEN** the system returns all folders including root sorted by path

#### Scenario: List direct child folders
- **WHEN** a user lists folders filtered by `parentFolderId`
- **THEN** the system returns only direct children of that parent sorted by folder name

#### Scenario: Retrieve missing folder
- **WHEN** a user retrieves a folder ID that does not exist
- **THEN** the system responds that the folder was not found

### Requirement: Folder rename updates paths
The system SHALL update a renamed folder path and all descendant paths to reflect the new folder name.

#### Scenario: Rename folder with descendants
- **WHEN** a user renames a folder that has nested child folders
- **THEN** the system updates the renamed folder path and each descendant folder path

#### Scenario: Rename folder timestamp
- **WHEN** a user successfully renames a folder
- **THEN** the system updates that folder's `updatedAt` timestamp

### Requirement: Folder deletion only removes empty user folders
The system SHALL delete only non-root folders that have no child folders, no assigned content, and no assigned static files according to folder occupancy signals.

#### Scenario: Delete empty folder
- **WHEN** a user deletes a non-root folder with no child folders, no assigned content, and no assigned static files
- **THEN** the system removes the folder and returns a successful empty response

#### Scenario: Reject folder with child folders
- **WHEN** a user deletes a folder that has child folders
- **THEN** the system rejects the operation as a non-empty folder conflict

#### Scenario: Reject folder with assigned content
- **WHEN** a user deletes a folder that has assigned content reported by the content repository
- **THEN** the system rejects the operation as a non-empty folder conflict

#### Scenario: Reject folder with assigned static files
- **WHEN** a user deletes a folder that has assigned static files reported by the static file repository or occupancy adapter
- **THEN** the system rejects the operation as a non-empty folder conflict

### Requirement: Folder management REST API
The system SHALL expose Content Service REST endpoints for listing, retrieving, creating, renaming, and deleting folders under `/api/management/folders`.

#### Scenario: Create folder endpoint
- **WHEN** a valid `POST /api/management/folders` request includes `name` and `parentFolderId`
- **THEN** the system responds with status `201` and the created folder response

#### Scenario: Rename folder endpoint
- **WHEN** a valid `PATCH /api/management/folders/{folderId}` request includes `name`
- **THEN** the system responds with status `200` and the updated folder response

#### Scenario: Delete folder endpoint
- **WHEN** a valid `DELETE /api/management/folders/{folderId}` request deletes an empty user folder
- **THEN** the system responds with status `204`

#### Scenario: Map folder API errors
- **WHEN** a folder management request fails validation, lookup, or conflict rules
- **THEN** the system maps the failure to `400`, `404`, or `409` according to the error category

### Requirement: Folder management APIs are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/folders` to the Content Service.

#### Scenario: Gateway forwards folder list
- **WHEN** the API Gateway receives `GET /api/management/folders` with or without query parameters
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway forwards folder detail
- **WHEN** the API Gateway receives `GET /api/management/folders/{folderId}`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway preserves folder API errors
- **WHEN** the Content Service responds with a folder validation, not-found, or conflict error
- **THEN** the API Gateway returns the same status code and response body to the caller
