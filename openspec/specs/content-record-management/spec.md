## Purpose

Define backend management of draft content records in the Content Service, including shared contracts, validation, folder assignment, versioned updates, in-memory persistence, and REST endpoints for Phase 3.

## Requirements

### Requirement: Content record contracts are shared
The system SHALL define shared TypeScript contracts for backend content management records and requests.

#### Scenario: Content record response shape is exposed
- **WHEN** a content record is returned by a management API or use case
- **THEN** the response includes `contentId`, `folderId`, `contentType`, `schemaVersion`, `version`, `status`, `data`, `createdAt`, and `updatedAt`

#### Scenario: Draft status is the only introduced status
- **WHEN** a content record is created in this slice
- **THEN** the record status is `draft`

#### Scenario: Content input contracts are exposed
- **WHEN** create, replace, or patch requests are typed
- **THEN** shared contracts represent `folderId`, `contentType`, optional `schemaVersion`, and `data` according to the operation semantics

### Requirement: Content records are created as validated drafts
The system SHALL create content records only when the target folder exists and the content data validates against a resolved content type schema.

#### Scenario: Create content with latest schema
- **WHEN** a create request omits `schemaVersion` and provides valid data for an existing active content type schema
- **THEN** the system creates a content record with a generated `RCD-` content ID and persists the latest active schema version on the record

#### Scenario: Create content with explicit schema version
- **WHEN** a create request provides `schemaVersion` and valid data for that schema version
- **THEN** the system creates a content record using the requested schema version

#### Scenario: Create initializes draft version
- **WHEN** a content record is created successfully
- **THEN** the record has `version` `1`, `status` `draft`, and creation and update timestamps

#### Scenario: Reject create in missing folder
- **WHEN** a create request references a folder ID that does not exist
- **THEN** the system rejects the request because the folder was not found

#### Scenario: Reject create for missing schema
- **WHEN** a create request references a content type or schema version that cannot be resolved
- **THEN** the system rejects the request because the schema was not found

#### Scenario: Reject create with invalid content data
- **WHEN** a create request contains data that fails content validation
- **THEN** the system rejects the request with structured validation errors

### Requirement: Content records can be listed and retrieved
The system SHALL list content records with optional folder filtering and retrieve content records by content ID.

#### Scenario: List all content records
- **WHEN** content records are listed without a folder filter
- **THEN** the system returns all content records sorted by `createdAt`, then `contentId`

#### Scenario: List content records by folder
- **WHEN** content records are listed with a `folderId` filter
- **THEN** the system returns only content records assigned to that folder sorted by `createdAt`, then `contentId`

#### Scenario: Retrieve content record
- **WHEN** an existing content ID is retrieved
- **THEN** the system returns that content record

#### Scenario: Retrieve missing content record
- **WHEN** a missing content ID is retrieved
- **THEN** the system rejects the request because the content record was not found

### Requirement: Content records can be replaced
The system SHALL replace a content record only when the target folder exists, content type remains unchanged, and the replacement data validates against the selected schema version.

#### Scenario: Replace content with stored schema version
- **WHEN** a replace request omits `schemaVersion` and provides valid data
- **THEN** the system validates against the content record's stored schema version and replaces the record data

#### Scenario: Replace content with explicit schema version
- **WHEN** a replace request provides `schemaVersion` and valid data for that schema version
- **THEN** the system stores the requested schema version and replaces the record data

#### Scenario: Replace increments version
- **WHEN** a content record is replaced successfully
- **THEN** the record `version` increments by `1` and `updatedAt` changes

#### Scenario: Reject replace for missing content
- **WHEN** a replace request targets a missing content ID
- **THEN** the system rejects the request because the content record was not found

#### Scenario: Reject replace in missing folder
- **WHEN** a replace request references a folder ID that does not exist
- **THEN** the system rejects the request because the folder was not found

#### Scenario: Reject replace with changed content type
- **WHEN** a replace request supplies a `contentType` different from the existing content record type
- **THEN** the system rejects the request as an immutable content type conflict

#### Scenario: Reject replace with invalid content data
- **WHEN** a replace request contains data that fails content validation
- **THEN** the system rejects the request with structured validation errors

### Requirement: Content records can be patched
The system SHALL patch content records by shallow-merging `data` fields and optionally changing folder assignment or schema version before validating the full resulting content data.

#### Scenario: Patch content data shallowly
- **WHEN** a patch request provides partial `data` fields
- **THEN** the system shallow-merges those fields into the existing record data and validates the full result before persistence

#### Scenario: Patch folder assignment
- **WHEN** a patch request provides an existing `folderId`
- **THEN** the system updates the content record folder assignment

#### Scenario: Patch schema version
- **WHEN** a patch request provides `schemaVersion` and the merged data validates against that schema version
- **THEN** the system stores the requested schema version on the content record

#### Scenario: Patch increments version
- **WHEN** a content record is patched successfully
- **THEN** the record `version` increments by `1` and `updatedAt` changes

#### Scenario: Reject patch for missing content
- **WHEN** a patch request targets a missing content ID
- **THEN** the system rejects the request because the content record was not found

#### Scenario: Reject patch in missing folder
- **WHEN** a patch request references a folder ID that does not exist
- **THEN** the system rejects the request because the folder was not found

#### Scenario: Reject patch with changed content type
- **WHEN** a patch request supplies a `contentType` different from the existing content record type
- **THEN** the system rejects the request as an immutable content type conflict

#### Scenario: Reject patch with invalid merged content data
- **WHEN** the merged patch result fails content validation
- **THEN** the system rejects the request with structured validation errors

### Requirement: Content records can be hard deleted
The system SHALL hard-delete content records for this backend CRUD slice.

#### Scenario: Delete content record
- **WHEN** an existing content record is deleted
- **THEN** the system removes the record and returns a successful empty response

#### Scenario: Delete missing content record
- **WHEN** a delete request targets a missing content ID
- **THEN** the system rejects the request because the content record was not found

### Requirement: Content repository protects stored records
The system SHALL provide an in-memory content repository that clones records defensively and reports folder occupancy.

#### Scenario: Repository returns defensive copies
- **WHEN** a caller mutates a content record returned by the repository
- **THEN** the stored record is not changed unless it is explicitly saved again

#### Scenario: Repository detects assigned content
- **WHEN** at least one content record is assigned to a folder ID
- **THEN** the repository reports that the folder has assigned content

#### Scenario: Repository reports empty folder
- **WHEN** no content records are assigned to a folder ID
- **THEN** the repository reports that the folder has no assigned content

### Requirement: Content management REST API is exposed
The system SHALL expose Content Service REST endpoints for listing, retrieving, creating, replacing, patching, and deleting content records under `/api/management/contents`.

#### Scenario: List content endpoint
- **WHEN** a valid `GET /api/management/contents` request is made with or without `folderId`
- **THEN** the system responds with status `200` and matching content records

#### Scenario: Retrieve content endpoint
- **WHEN** a valid `GET /api/management/contents/{contentId}` request retrieves an existing record
- **THEN** the system responds with status `200` and the content record

#### Scenario: Create content endpoint
- **WHEN** a valid `POST /api/management/contents` request is made
- **THEN** the system responds with status `201` and the created content record

#### Scenario: Replace content endpoint
- **WHEN** a valid `PUT /api/management/contents/{contentId}` request is made
- **THEN** the system responds with status `200` and the replaced content record

#### Scenario: Patch content endpoint
- **WHEN** a valid `PATCH /api/management/contents/{contentId}` request is made
- **THEN** the system responds with status `200` and the patched content record

#### Scenario: Delete content endpoint
- **WHEN** a valid `DELETE /api/management/contents/{contentId}` request deletes an existing record
- **THEN** the system responds with status `204`

#### Scenario: Map content API errors
- **WHEN** a content management request fails body validation, content data validation, lookup, or immutable type rules
- **THEN** the system maps the failure to `400`, `404`, or `409` according to the error category

### Requirement: Content management APIs are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/contents` to the Content Service.

#### Scenario: Gateway forwards content list
- **WHEN** the API Gateway receives `GET /api/management/contents` with or without query parameters
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway forwards content mutations
- **WHEN** the API Gateway receives `POST`, `PUT`, `PATCH`, or `DELETE` requests under `/api/management/contents`
- **THEN** it forwards the method, path, query, and JSON body to the Content Service and returns the service status and response body

#### Scenario: Gateway preserves content API errors
- **WHEN** the Content Service responds with a content validation, not-found, or conflict error
- **THEN** the API Gateway returns the same status code and response body to the caller

### Requirement: Initial generic schema is available for content validation
The Content Service SHALL include an in-memory active `generic` schema for local draft content creation until persistent schema sharing is introduced.

#### Scenario: Create generic content with seeded schema
- **WHEN** a valid `POST /api/management/contents` request creates content of type `generic` and omits `schemaVersion`
- **THEN** the Content Service validates the data against seeded `generic` version `1.0` and creates the draft record

#### Scenario: Seeded schema version is stored
- **WHEN** generic content is created using the seeded latest schema
- **THEN** the created content record stores `schemaVersion` `1.0`
