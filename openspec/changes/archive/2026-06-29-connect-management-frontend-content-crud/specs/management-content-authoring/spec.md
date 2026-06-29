## ADDED Requirements

### Requirement: Folder explorer loads management data through the gateway
The Management Frontend SHALL load folder and content data through relative API Gateway management URLs.

#### Scenario: Load folders on explorer entry
- **WHEN** an author opens the folder explorer
- **THEN** the frontend requests `GET /api/management/folders` and displays the returned folder hierarchy including `FLD-root`

#### Scenario: Load selected folder content
- **WHEN** an author selects or navigates to a folder ID
- **THEN** the frontend requests `GET /api/management/contents?folderId={folderId}` and displays only content records assigned to that folder

#### Scenario: Show empty selected folder
- **WHEN** the selected folder contains no content records
- **THEN** the frontend displays an empty content state without treating it as an error

#### Scenario: Show loading and request failure states
- **WHEN** folder, content, or schema requests are pending or fail
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
