## Purpose

Define static file upload and metadata management for folder-scoped authoring assets in the Content Service.

## Requirements

### Requirement: Static file contracts are shared
The system SHALL define shared TypeScript contracts for static file metadata management.

#### Scenario: Static file response shape is exposed
- **WHEN** a static file is returned by a management API or use case
- **THEN** the response includes `fileId`, `folderId`, `filename`, `mimeType`, `size`, `path`, `createdAt`, and `updatedAt`

#### Scenario: Static file identifiers use the static file prefix
- **WHEN** static file identifiers are typed or generated
- **THEN** they use the `STF-` global ID prefix

#### Scenario: Static file update input is exposed
- **WHEN** metadata update requests are typed
- **THEN** a shared contract represents an editable `filename`

#### Scenario: Static file errors are normalized
- **WHEN** static file failures are represented in shared contracts
- **THEN** error codes cover not found, missing folder, invalid filename, missing upload, unsupported MIME type, oversized upload, and storage failure categories

### Requirement: Static file metadata is folder-scoped
The system SHALL assign each static file to an existing folder.

#### Scenario: Create file metadata in folder
- **WHEN** a valid upload references an existing folder ID
- **THEN** the system creates static file metadata assigned to that folder ID

#### Scenario: Reject file upload in missing folder
- **WHEN** an upload references a folder ID that does not exist
- **THEN** the system rejects the request because the folder was not found

#### Scenario: Static file metadata does not require content assignment
- **WHEN** a static file is created in this slice
- **THEN** the system does not require or store a `contentId` on the static file metadata

### Requirement: Static file uploads are validated and stored
The system SHALL accept one uploaded file, validate upload metadata, store the binary through a storage port, and persist metadata through a repository port.

#### Scenario: Upload valid static file
- **WHEN** a multipart upload includes one `file` part and one `folderId` field with an allowed MIME type and valid filename
- **THEN** the system stores the binary, creates metadata with a generated `STF-` ID, and returns the created static file metadata

#### Scenario: Reject missing upload file
- **WHEN** a multipart upload omits the `file` part
- **THEN** the system rejects the request as malformed input

#### Scenario: Reject invalid filename
- **WHEN** an upload filename is empty, too long, contains path separators, or contains unsafe control/path characters
- **THEN** the system rejects the request as malformed input

#### Scenario: Reject unsupported MIME type
- **WHEN** an upload has a MIME type outside the allowed set
- **THEN** the system rejects the request as an unsupported media type

#### Scenario: Reject oversized upload
- **WHEN** an upload exceeds the configured 10 MiB file size limit
- **THEN** the system rejects the request as too large

#### Scenario: Store generated internal path
- **WHEN** a file is stored
- **THEN** the system stores an internal generated path based on the static file ID rather than trusting a client-supplied filesystem path

### Requirement: Static file metadata can be listed and retrieved
The system SHALL list static files by folder and retrieve static file metadata by file ID.

#### Scenario: List static files by folder
- **WHEN** static files are listed with a `folderId` filter
- **THEN** the system returns only static files assigned to that folder sorted by `createdAt`, then `fileId`

#### Scenario: Retrieve static file metadata
- **WHEN** an existing static file ID is retrieved
- **THEN** the system returns that static file metadata

#### Scenario: Retrieve missing static file metadata
- **WHEN** a missing static file ID is retrieved
- **THEN** the system rejects the request because the static file was not found

### Requirement: Static file metadata can be renamed
The system SHALL allow updating editable static file metadata without replacing the binary.

#### Scenario: Rename static file metadata
- **WHEN** a valid update request provides a new filename for an existing static file
- **THEN** the system stores the normalized filename and updates `updatedAt`

#### Scenario: Reject rename with invalid filename
- **WHEN** a metadata update filename is empty, too long, contains path separators, or contains unsafe control/path characters
- **THEN** the system rejects the request as malformed input

#### Scenario: Rename missing static file metadata
- **WHEN** an update targets a missing static file ID
- **THEN** the system rejects the request because the static file was not found

### Requirement: Static files can be deleted
The system SHALL delete static file metadata and the associated binary file for this slice.

#### Scenario: Delete static file
- **WHEN** an existing static file is deleted
- **THEN** the system removes the metadata, invokes binary storage cleanup, and returns a successful empty response

#### Scenario: Delete missing static file
- **WHEN** a delete request targets a missing static file ID
- **THEN** the system rejects the request because the static file was not found

#### Scenario: Surface storage cleanup failure
- **WHEN** binary cleanup fails during deletion
- **THEN** the system reports a storage failure instead of silently leaving inconsistent state

### Requirement: Static file repository protects stored metadata
The system SHALL provide an in-memory static file repository that clones metadata defensively and reports folder occupancy.

#### Scenario: Repository returns defensive copies
- **WHEN** a caller mutates static file metadata returned by the repository
- **THEN** the stored metadata is not changed unless it is explicitly saved again

#### Scenario: Repository detects assigned files
- **WHEN** at least one static file is assigned to a folder ID
- **THEN** the repository reports that the folder has assigned files

#### Scenario: Repository reports folder without files
- **WHEN** no static files are assigned to a folder ID
- **THEN** the repository reports that the folder has no assigned files

### Requirement: Static file management REST API is exposed
The system SHALL expose Content Service REST endpoints for static file upload and metadata management under `/api/management/files`.

#### Scenario: List files endpoint
- **WHEN** a valid `GET /api/management/files?folderId={folderId}` request is made
- **THEN** the system responds with status `200` and matching static file metadata

#### Scenario: Retrieve file endpoint
- **WHEN** a valid `GET /api/management/files/{fileId}` request retrieves an existing static file
- **THEN** the system responds with status `200` and the static file metadata

#### Scenario: Upload file endpoint
- **WHEN** a valid `POST /api/management/files` multipart request includes `folderId` and `file`
- **THEN** the system responds with status `201` and the created static file metadata

#### Scenario: Update file metadata endpoint
- **WHEN** a valid `PATCH /api/management/files/{fileId}` JSON request includes `filename`
- **THEN** the system responds with status `200` and the updated static file metadata

#### Scenario: Delete file endpoint
- **WHEN** a valid `DELETE /api/management/files/{fileId}` request deletes an existing static file
- **THEN** the system responds with status `204`

#### Scenario: Map file API errors
- **WHEN** a static file management request fails body validation, upload validation, lookup, media type, size limit, or storage rules
- **THEN** the system maps the failure to `400`, `404`, `413`, `415`, or `500` according to the error category

### Requirement: Static file uploads are hardened
The system SHALL configure explicit multipart upload limits and MIME allowlisting for static file uploads.

#### Scenario: Limit multipart upload shape
- **WHEN** the Content Service receives a file upload request
- **THEN** multipart handling allows at most one file field and one metadata field

#### Scenario: Limit multipart nesting and size
- **WHEN** the Content Service parses upload fields
- **THEN** multipart handling applies bounded field nesting depth and a 10 MiB file size limit

#### Scenario: Allow only supported MIME types
- **WHEN** a file upload MIME type is validated
- **THEN** only `application/pdf`, `text/plain`, `image/jpeg`, `image/png`, `image/gif`, and `image/webp` are accepted

### Requirement: Static file management APIs are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/files` to the Content Service.

#### Scenario: Gateway forwards file metadata reads
- **WHEN** the API Gateway receives `GET /api/management/files` or `GET /api/management/files/{fileId}`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway forwards file metadata mutations
- **WHEN** the API Gateway receives `PATCH` or `DELETE` requests under `/api/management/files`
- **THEN** it forwards the method, path, query, and JSON body to the Content Service and returns the service status and response body

#### Scenario: Gateway preserves multipart upload requests
- **WHEN** the API Gateway receives `POST /api/management/files` with multipart form data
- **THEN** it forwards the multipart request to the Content Service without replacing the content type with JSON

#### Scenario: Gateway preserves file API errors
- **WHEN** the Content Service responds with a static file validation, not-found, media type, size, or storage error
- **THEN** the API Gateway returns the same status code and response body to the caller
