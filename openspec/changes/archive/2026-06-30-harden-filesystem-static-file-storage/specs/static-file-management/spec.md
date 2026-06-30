## ADDED Requirements

### Requirement: Filesystem static file writes are published atomically
The system SHALL write filesystem-backed static file binaries to a temporary file under the configured storage root before publishing the completed binary to the generated final storage path.

#### Scenario: Store binary through temporary file
- **WHEN** a valid static file upload is stored by the filesystem storage adapter
- **THEN** the adapter writes the binary to a temporary path under the configured storage root and moves the completed file to the generated final path before returning metadata

#### Scenario: Return only final generated path
- **WHEN** filesystem storage completes for a static file
- **THEN** the returned storage path is the generated final relative path and does not expose the temporary path or client filename as a filesystem path

#### Scenario: Failed write does not publish final path
- **WHEN** filesystem storage fails before the completed binary is moved into place
- **THEN** the generated final path is not returned as a successful stored path

### Requirement: Filesystem static file paths remain confined to the storage root
The system SHALL resolve filesystem-backed static file storage paths within `STATIC_FILE_STORAGE_ROOT` and reject operations that would escape that root.

#### Scenario: Delete stored file inside root
- **WHEN** a stored static file path resolves under the configured storage root
- **THEN** filesystem storage deletes that path without accessing files outside the storage root

#### Scenario: Reject stored path traversal
- **WHEN** a stored static file path would resolve outside the configured storage root
- **THEN** filesystem storage rejects the operation as a storage failure

### Requirement: Filesystem storage root behavior is documented
The system SHALL document the runtime behavior of filesystem-backed static file storage for local development and deployment.

#### Scenario: Configure management storage root
- **WHEN** operators configure `STATIC_FILE_STORAGE_ROOT`
- **THEN** the Content Service stores management static file binaries under that configured root

#### Scenario: Use local development default
- **WHEN** `STATIC_FILE_STORAGE_ROOT` is not configured
- **THEN** the Content Service uses a documented local development storage path

#### Scenario: Document scaffold metadata limitation
- **WHEN** Phase 3 uses in-memory static file metadata with filesystem-backed binaries
- **THEN** documentation explains that service restarts can leave local orphaned binaries until metadata persistence is added
