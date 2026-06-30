## ADDED Requirements

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
