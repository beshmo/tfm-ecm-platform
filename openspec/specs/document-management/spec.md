## Purpose

Define document upload and metadata management for folder-scoped authoring assets in the Content Service.

## Requirements

### Requirement: Document contracts are shared
The system SHALL define shared TypeScript contracts for document metadata management.

#### Scenario: Document response shape is exposed
- **WHEN** a document is returned by a management API or use case
- **THEN** the response includes `fileId`, `folderId`, `filename`, `mimeType`, `size`, `path`, `createdAt`, and `updatedAt`

#### Scenario: Document identifiers use the document compatibility prefix
- **WHEN** document identifiers are typed or generated
- **THEN** they use the `STF-` global ID compatibility prefix

#### Scenario: Document update input is exposed
- **WHEN** metadata update requests are typed
- **THEN** a shared contract represents an editable `filename`

#### Scenario: Document errors are normalized
- **WHEN** document failures are represented in shared contracts
- **THEN** error codes cover not found, missing folder, invalid filename, missing upload, unsupported MIME type, oversized upload, and storage failure categories

### Requirement: Document metadata is folder-scoped
The system SHALL assign each document to an existing folder.

#### Scenario: Create document metadata in folder
- **WHEN** a valid upload references an existing folder ID
- **THEN** the system creates document metadata assigned to that folder ID

#### Scenario: Reject document upload in missing folder
- **WHEN** an upload references a folder ID that does not exist
- **THEN** the system rejects the request because the folder was not found

#### Scenario: Document metadata does not require content assignment
- **WHEN** a document is created in this slice
- **THEN** the system does not require or store a `contentId` on the document metadata

### Requirement: Document uploads are validated and stored
The system SHALL accept one uploaded file, validate upload metadata, store the binary through a storage port, and persist metadata through a repository port.

#### Scenario: Upload valid document
- **WHEN** a multipart upload includes one `file` part and one `folderId` field with an allowed MIME type and valid filename
- **THEN** the system stores the binary, creates metadata with a generated `STF-` ID, and returns the created document metadata

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
- **THEN** the system stores an internal generated path based on the document ID rather than trusting a client-supplied filesystem path

### Requirement: Document metadata can be listed and retrieved
The system SHALL list documents by folder and retrieve document metadata by file ID.

#### Scenario: List documents by folder
- **WHEN** documents are listed with a `folderId` filter
- **THEN** the system returns only documents assigned to that folder sorted by `createdAt`, then `fileId`

#### Scenario: Retrieve document metadata
- **WHEN** an existing document ID is retrieved
- **THEN** the system returns that document metadata

#### Scenario: Retrieve missing document metadata
- **WHEN** a missing document ID is retrieved
- **THEN** the system rejects the request because the document was not found

### Requirement: Document metadata can be renamed
The system SHALL allow updating editable document metadata without replacing the binary.

#### Scenario: Rename document metadata
- **WHEN** a valid update request provides a new filename for an existing document
- **THEN** the system stores the normalized filename and updates `updatedAt`

#### Scenario: Reject rename with invalid filename
- **WHEN** a metadata update filename is empty, too long, contains path separators, or contains unsafe control/path characters
- **THEN** the system rejects the request as malformed input

#### Scenario: Rename missing document metadata
- **WHEN** an update targets a missing document ID
- **THEN** the system rejects the request because the document was not found

### Requirement: Documents can be deleted
The system SHALL delete document metadata and the associated binary file for this slice.

#### Scenario: Delete document
- **WHEN** an existing document is deleted
- **THEN** the system removes the metadata, invokes binary storage cleanup, and returns a successful empty response

#### Scenario: Delete missing document
- **WHEN** a delete request targets a missing document ID
- **THEN** the system rejects the request because the document was not found

#### Scenario: Surface storage cleanup failure
- **WHEN** binary cleanup fails during deletion
- **THEN** the system reports a storage failure instead of silently leaving inconsistent state

### Requirement: Document repository protects stored metadata
The system SHALL provide an in-memory document repository that clones metadata defensively and reports folder occupancy.

#### Scenario: Repository returns defensive copies
- **WHEN** a caller mutates document metadata returned by the repository
- **THEN** the stored metadata is not changed unless it is explicitly saved again

#### Scenario: Repository detects assigned files
- **WHEN** at least one document is assigned to a folder ID
- **THEN** the repository reports that the folder has assigned files

#### Scenario: Repository reports folder without files
- **WHEN** no documents are assigned to a folder ID
- **THEN** the repository reports that the folder has no assigned files

### Requirement: Document management REST API is exposed
The system SHALL expose Content Service REST endpoints for document upload and metadata management under `/api/management/files`.

#### Scenario: List files endpoint
- **WHEN** a valid `GET /api/management/files?folderId={folderId}` request is made
- **THEN** the system responds with status `200` and matching document metadata

#### Scenario: Retrieve file endpoint
- **WHEN** a valid `GET /api/management/files/{fileId}` request retrieves an existing document
- **THEN** the system responds with status `200` and the document metadata

#### Scenario: Upload file endpoint
- **WHEN** a valid `POST /api/management/files` multipart request includes `folderId` and `file`
- **THEN** the system responds with status `201` and the created document metadata

#### Scenario: Update document metadata endpoint
- **WHEN** a valid `PATCH /api/management/files/{fileId}` JSON request includes `filename`
- **THEN** the system responds with status `200` and the updated document metadata

#### Scenario: Delete file endpoint
- **WHEN** a valid `DELETE /api/management/files/{fileId}` request deletes an existing document
- **THEN** the system responds with status `204`

#### Scenario: Map file API errors
- **WHEN** a document management request fails body validation, upload validation, lookup, media type, size limit, or storage rules
- **THEN** the system maps the failure to `400`, `404`, `413`, `415`, or `500` according to the error category

### Requirement: Document uploads are hardened
The system SHALL configure explicit multipart upload limits and MIME allowlisting for document uploads.

#### Scenario: Limit multipart upload shape
- **WHEN** the Content Service receives a document upload request
- **THEN** multipart handling allows at most one file field and one metadata field

#### Scenario: Limit multipart nesting and size
- **WHEN** the Content Service parses upload fields
- **THEN** multipart handling applies bounded field nesting depth and a 10 MiB file size limit

#### Scenario: Allow only supported MIME types
- **WHEN** a document upload MIME type is validated
- **THEN** only `application/pdf`, `text/plain`, `image/jpeg`, `image/png`, `image/gif`, and `image/webp` are accepted

### Requirement: Filesystem document writes are published atomically
The system SHALL write filesystem-backed document binaries to a temporary file under the configured storage root before publishing the completed binary to the generated final storage path.

#### Scenario: Store binary through temporary file
- **WHEN** a valid document upload is stored by the filesystem storage adapter
- **THEN** the adapter writes the binary to a temporary path under the configured storage root and moves the completed file to the generated final path before returning metadata

#### Scenario: Return only final generated path
- **WHEN** filesystem storage completes for a document
- **THEN** the returned storage path is the generated final relative path and does not expose the temporary path or client filename as a filesystem path

#### Scenario: Failed write does not publish final path
- **WHEN** filesystem storage fails before the completed binary is moved into place
- **THEN** the generated final path is not returned as a successful stored path

### Requirement: Filesystem document paths remain confined to the storage root
The system SHALL resolve filesystem-backed document storage paths within `STATIC_FILE_STORAGE_ROOT` and reject operations that would escape that root.

#### Scenario: Delete stored file inside root
- **WHEN** a stored document path resolves under the configured storage root
- **THEN** filesystem storage deletes that path without accessing files outside the storage root

#### Scenario: Reject stored path traversal
- **WHEN** a stored document path would resolve outside the configured storage root
- **THEN** filesystem storage rejects the operation as a storage failure

### Requirement: Filesystem storage root behavior is documented
The system SHALL document the runtime behavior of filesystem-backed document storage for local development and deployment.

#### Scenario: Configure management storage root
- **WHEN** operators configure `STATIC_FILE_STORAGE_ROOT`
- **THEN** the Content Service stores management document binaries under that configured root

#### Scenario: Use local development default
- **WHEN** `STATIC_FILE_STORAGE_ROOT` is not configured
- **THEN** the Content Service uses a documented local development storage path

#### Scenario: Document scaffold metadata limitation
- **WHEN** Phase 3 uses in-memory document metadata with filesystem-backed binaries
- **THEN** documentation explains that service restarts can leave local orphaned binaries until metadata persistence is added

### Requirement: Document management APIs are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/files` to the Content Service.

#### Scenario: Gateway forwards document metadata reads
- **WHEN** the API Gateway receives `GET /api/management/files` or `GET /api/management/files/{fileId}`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway forwards document metadata mutations
- **WHEN** the API Gateway receives `PATCH` or `DELETE` requests under `/api/management/files`
- **THEN** it forwards the method, path, query, and JSON body to the Content Service and returns the service status and response body

#### Scenario: Gateway preserves multipart upload requests
- **WHEN** the API Gateway receives `POST /api/management/files` with multipart form data
- **THEN** it forwards the multipart request to the Content Service without replacing the content type with JSON

#### Scenario: Gateway preserves file API errors
- **WHEN** the Content Service responds with a document validation, not-found, media type, size, or storage error
- **THEN** the API Gateway returns the same status code and response body to the caller
