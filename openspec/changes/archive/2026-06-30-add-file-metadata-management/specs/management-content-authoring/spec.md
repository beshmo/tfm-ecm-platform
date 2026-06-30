## MODIFIED Requirements

### Requirement: Folder explorer loads management data through the gateway
The Management Frontend SHALL load folder, content, and static file data through relative API Gateway management URLs.

#### Scenario: Load folders on explorer entry
- **WHEN** an author opens the folder explorer
- **THEN** the frontend requests `GET /api/management/folders` and displays the returned folder hierarchy including `FLD-root`

#### Scenario: Load selected folder content
- **WHEN** an author selects or navigates to a folder ID
- **THEN** the frontend requests `GET /api/management/contents?folderId={folderId}` and displays only content records assigned to that folder

#### Scenario: Load selected folder files
- **WHEN** an author selects or navigates to a folder ID
- **THEN** the frontend requests `GET /api/management/files?folderId={folderId}` and displays only static files assigned to that folder

#### Scenario: Show empty selected folder
- **WHEN** the selected folder contains no content records and no static files
- **THEN** the frontend displays an empty selected-folder state without treating it as an error

#### Scenario: Show loading and request failure states
- **WHEN** folder, content, file, or schema requests are pending or fail
- **THEN** the frontend displays loading feedback during the request and an inline error state when the request fails

## ADDED Requirements

### Requirement: Authors can upload static files
The Management Frontend SHALL allow authors to upload static files into the selected folder through the API Gateway.

#### Scenario: Upload static file successfully
- **WHEN** an author chooses a supported file and submits an upload for the selected folder
- **THEN** the frontend sends `POST /api/management/files` as `FormData` with `folderId` and `file`, then refreshes the selected folder file list

#### Scenario: Display upload validation errors
- **WHEN** the backend rejects an upload because of missing file, invalid filename, unsupported MIME type, oversized upload, or missing folder
- **THEN** the frontend displays the error message without clearing the selected folder state

#### Scenario: FormData content type is browser controlled
- **WHEN** the frontend sends a static file upload
- **THEN** the file API client does not manually set the `content-type` header

### Requirement: Authors can rename static file metadata
The Management Frontend SHALL allow authors to update editable static file metadata for a file in the selected folder.

#### Scenario: Rename static file successfully
- **WHEN** an author submits a valid filename for an existing static file
- **THEN** the frontend sends `PATCH /api/management/files/{fileId}` with `filename`, then refreshes the selected folder file list

#### Scenario: Display rename validation errors
- **WHEN** the backend rejects a file rename because the filename is invalid or the file no longer exists
- **THEN** the frontend displays the error message and keeps the selected folder visible

### Requirement: Authors can delete static files
The Management Frontend SHALL allow authors to delete an existing static file after confirmation.

#### Scenario: Delete static file successfully
- **WHEN** an author confirms deletion of an existing static file
- **THEN** the frontend sends `DELETE /api/management/files/{fileId}` and removes the file from the selected folder file list after a successful `204` response

#### Scenario: Cancel static file deletion
- **WHEN** an author cancels a static file delete confirmation
- **THEN** the frontend does not send a delete request and leaves the file list unchanged

#### Scenario: Display static file delete not found
- **WHEN** the backend reports that the static file no longer exists
- **THEN** the frontend displays a not-found message and refreshes the selected folder file list
