## Purpose

Define the Management Frontend authoring capability for browsing folders and managing draft content records through schema-driven forms connected to gateway APIs.

## Requirements

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

### Requirement: Content editor uses content type schemas
The Management Frontend SHALL render content create and edit forms from content type schema definitions returned by the gateway.

#### Scenario: Choose content type for new content
- **WHEN** an author starts creating content
- **THEN** the frontend requests active content type summaries and lets the author choose one before rendering the schema fields

#### Scenario: Render latest schema fields
- **WHEN** an author chooses a content type for new content
- **THEN** the frontend retrieves the latest schema and renders one form control for each declared field

#### Scenario: Render stored schema fields for editing
- **WHEN** an author edits an existing content record
- **THEN** the frontend retrieves that record's `contentType` and `schemaVersion` schema and renders the record data into matching fields

#### Scenario: Enforce required fields before submit
- **WHEN** a schema field is marked `required`
- **THEN** the frontend prevents submission until the author provides a value for that field

### Requirement: Authors can create draft content records
The Management Frontend SHALL allow authors to create draft content records in the selected folder.

#### Scenario: Create content successfully
- **WHEN** an author submits valid create form data for the selected folder and content type
- **THEN** the frontend sends `POST /api/management/contents` with `folderId`, `contentType`, optional `schemaVersion`, and `data`, then refreshes the selected folder content list

#### Scenario: Display create validation errors
- **WHEN** the backend rejects a create request with structured validation errors
- **THEN** the frontend displays the validation messages without clearing the author's form data

### Requirement: Authors can edit draft content records
The Management Frontend SHALL allow authors to replace editable draft content data for an existing content record.

#### Scenario: Update content successfully
- **WHEN** an author submits valid edits for an existing content record
- **THEN** the frontend sends `PUT /api/management/contents/{contentId}` with the record folder, immutable content type, schema version, and form data, then refreshes the selected folder content list

#### Scenario: Display update conflict
- **WHEN** the backend rejects an update because of immutable content type or conflict rules
- **THEN** the frontend displays the conflict message and keeps the editor open

### Requirement: Authors can delete draft content records
The Management Frontend SHALL allow authors to delete an existing draft content record after confirmation.

#### Scenario: Delete content successfully
- **WHEN** an author confirms deletion of an existing content record
- **THEN** the frontend sends `DELETE /api/management/contents/{contentId}` and removes the record from the selected folder content list after a successful `204` response

#### Scenario: Cancel content deletion
- **WHEN** an author cancels a delete confirmation
- **THEN** the frontend does not send a delete request and leaves the content list unchanged

#### Scenario: Display delete not found
- **WHEN** the backend reports that the content record no longer exists
- **THEN** the frontend displays a not-found message and refreshes the selected folder content list

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

### Requirement: Content management frontend workflows are covered by Angular integration tests
The Management Frontend SHALL include Angular component integration tests that render content management workflows through the folder explorer template with mocked frontend API clients.

#### Scenario: Render folder explorer management data
- **WHEN** the folder explorer component integration test renders with mocked folders, content records, and static files
- **THEN** the rendered view shows the folder hierarchy, selected folder content records, selected folder static files, and selected folder path

#### Scenario: Exercise rendered folder selection
- **WHEN** a component integration test activates a rendered folder control
- **THEN** the frontend requests content and files for that folder and updates the rendered selected-folder lists

#### Scenario: Exercise rendered content creation form
- **WHEN** a component integration test opens the new content editor, fills schema-rendered controls, and submits valid data
- **THEN** the frontend calls the content create client with the selected folder, content type, schema version, and converted form data, then refreshes the selected folder

#### Scenario: Exercise rendered content edit form
- **WHEN** a component integration test opens an existing content record for editing and submits valid changes
- **THEN** the frontend resolves the stored schema version, calls the content replace client, and refreshes the selected folder

#### Scenario: Exercise rendered static file workflows
- **WHEN** component integration tests upload, rename, and delete static files through rendered controls
- **THEN** the frontend calls the matching static file client operations and keeps the rendered selected-folder state consistent with successful or cancelled actions

#### Scenario: Preserve visible validation and error states
- **WHEN** mocked frontend API clients reject content, file, schema, or folder requests with structured errors
- **THEN** the rendered view displays the appropriate inline error or validation messages without clearing the author's selected folder or entered form data

### Requirement: Content management routes are covered by Angular integration tests
The Management Frontend SHALL include route integration tests for content management entry points using Angular Router and mocked frontend API clients.

#### Scenario: Render default folder explorer route
- **WHEN** a route integration test navigates to `/folders`
- **THEN** the folder explorer renders using `FLD-root` as the selected folder

#### Scenario: Bind folder route parameter
- **WHEN** a route integration test navigates to `/folders/{folderId}`
- **THEN** the folder explorer receives the route folder ID and requests the selected folder content and static files for that ID

### Requirement: Content management API clients are covered by focused unit tests
The Management Frontend SHALL include focused unit tests for frontend content management API clients that verify gateway URLs, request payloads, upload behavior, and error mapping.

#### Scenario: Encode content and file identifiers
- **WHEN** content or static file API clients call routes with folder, content, file, content type, or schema version identifiers
- **THEN** unit tests verify that dynamic URL segments and query parameters are encoded before being sent through Angular HTTP Client

#### Scenario: Keep upload content type browser controlled
- **WHEN** the static file API client uploads a selected file
- **THEN** unit tests verify the request body is `FormData` containing `folderId` and `file` and that the client does not set a manual `content-type` header

#### Scenario: Map representative management API errors
- **WHEN** mocked Angular HTTP failures represent validation, not-found, conflict, oversized upload, unsupported media type, or storage failures
- **THEN** unit tests verify that frontend API clients expose normalized API client errors and structured validation messages where provided

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
