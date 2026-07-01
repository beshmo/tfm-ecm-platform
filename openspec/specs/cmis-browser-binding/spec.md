## Purpose

Define the CMIS 1.1 Browser Binding compatibility surface that lets CMIS-aware clients browse and manage supported ECMP Management Stage resources.

## Requirements

### Requirement: CMIS Browser Binding repository is exposed
The system SHALL expose a CMIS 1.1 Browser Binding-compatible repository service for the ECMP Management Stage under `/api/cmis`.

#### Scenario: Retrieve service document
- **WHEN** a client requests the CMIS Browser Binding service document
- **THEN** the system returns JSON repository metadata for the ECMP management repository

#### Scenario: Repository capabilities are conservative
- **WHEN** repository metadata is returned
- **THEN** the system declares only the CMIS capabilities implemented by the current adapter

### Requirement: CMIS requests are routed through the gateway
The system SHALL route `/api/cmis` requests through the API Gateway to the CMIS adapter without changing existing `/api/management` routes.

#### Scenario: Gateway forwards CMIS read request
- **WHEN** the API Gateway receives a supported CMIS Browser Binding read request
- **THEN** it forwards the request to the CMIS adapter and returns the adapter response

#### Scenario: Gateway preserves CMIS mutation payload
- **WHEN** the API Gateway receives a supported CMIS Browser Binding mutation request with form or multipart data
- **THEN** it forwards the method, path, query, headers required for parsing, and request body to the CMIS adapter

### Requirement: CMIS type definitions map ECMP platform types
The system SHALL expose CMIS type definitions for ECMP folders, static files, and supported structured content records.

#### Scenario: List base type children
- **WHEN** a client requests CMIS type children for the repository root type scope
- **THEN** the system returns type definitions including `cmis:folder`, `cmis:document`, `cmis:item`, and supported ECMP custom types

#### Scenario: Map content type schema to custom type
- **WHEN** an active ECMP content type schema is exposed through CMIS type discovery
- **THEN** the system maps the schema to a stable CMIS custom type identifier with `cmis:item` as its parent type and exposes supported field definitions as CMIS properties

#### Scenario: Do not advertise unsupported optional base types
- **WHEN** a client requests CMIS type children for the repository root type scope
- **THEN** the system does not return `cmis:relationship`, `cmis:policy`, or `cmis:secondary` unless ECMP supports the corresponding CMIS behavior

### Requirement: CMIS object-type definitions expose common attributes
The system SHALL include the CMIS 1.1 common object-type attributes on every returned CMIS object-type definition.

#### Scenario: Base type definition includes common attributes
- **WHEN** the system returns a CMIS base object-type definition
- **THEN** the definition includes `id`, `localName`, `localNamespace`, `queryName`, `displayName`, `baseId`, `parentId`, `description`, `creatable`, `fileable`, `queryable`, `controllablePolicy`, `controllableACL`, `fulltextIndexed`, `includedInSupertypeQuery`, and `typeMutability`

#### Scenario: Custom content type definition includes common attributes
- **WHEN** the system returns a CMIS type definition for an ECMP content type schema
- **THEN** the definition includes all common object-type attributes and sets `baseId` to `cmis:item` and `parentId` to `cmis:item`

#### Scenario: Unsupported behavior flags are conservative
- **WHEN** the system returns CMIS object-type definitions while query, policy, ACL mutation, and type management services are unsupported
- **THEN** the returned type definitions set `queryable`, `controllablePolicy`, `controllableACL`, `fulltextIndexed`, `includedInSupertypeQuery`, and all `typeMutability` flags to `false`

### Requirement: CMIS objects map ECMP resources
The system SHALL map ECMP resource metadata into CMIS object representations.

#### Scenario: Map folder object
- **WHEN** a CMIS response includes an ECMP folder
- **THEN** the object has base type `cmis:folder`, object ID equal to the folder ID, name equal to the folder name or `/` for root, and parent metadata matching the folder hierarchy

#### Scenario: Map static file object
- **WHEN** a CMIS response includes an ECMP static file
- **THEN** the object has base type `cmis:document`, object ID equal to the static file ID, name equal to the filename, and content stream metadata from the stored file metadata

#### Scenario: Map content record object
- **WHEN** a CMIS response includes an ECMP content record
- **THEN** the object has a stable CMIS type derived from its content type and includes supported record metadata and schema fields as properties

### Requirement: CMIS navigation is supported
The system SHALL support browsing folders and resolving objects by ID or path.

#### Scenario: Get folder children
- **WHEN** a client requests the children of a CMIS folder backed by an ECMP folder
- **THEN** the system returns direct child folders, static files, and content records assigned to that folder

#### Scenario: Get object by ID
- **WHEN** a client requests an object by a known ECMP-backed CMIS object ID
- **THEN** the system returns the mapped CMIS object representation

#### Scenario: Get object by path
- **WHEN** a client requests an object by a valid ECMP folder or object path
- **THEN** the system resolves the path and returns the mapped CMIS object representation

#### Scenario: Missing object
- **WHEN** a client requests a CMIS object ID or path that does not exist
- **THEN** the system returns a CMIS-compatible not-found error response

### Requirement: CMIS content streams are supported for static files
The system SHALL expose content streams for CMIS documents backed by ECMP static files.

#### Scenario: Retrieve static file content stream
- **WHEN** a client requests the content stream for a CMIS document backed by an ECMP static file
- **THEN** the system returns the stored binary stream with the file MIME type and filename metadata

#### Scenario: Reject content stream for object without stream
- **WHEN** a client requests a content stream for a folder or a structured content record without a primary stream
- **THEN** the system returns a CMIS-compatible stream-not-supported error response

### Requirement: CMIS folder creation is supported
The system SHALL allow supported CMIS clients to create ECMP folders through the Browser Binding.

#### Scenario: Create folder
- **WHEN** a valid CMIS create-folder request provides a parent folder and folder name
- **THEN** the system creates an ECMP folder using existing folder rules and returns the mapped CMIS folder object

#### Scenario: Reject invalid folder create
- **WHEN** a CMIS create-folder request violates ECMP folder validation or parent lookup rules
- **THEN** the system returns a CMIS-compatible error response mapped from the ECMP folder error

### Requirement: CMIS document creation is supported for static files
The system SHALL allow supported CMIS clients to create static-file-backed CMIS documents through the Browser Binding.

#### Scenario: Create document with content stream
- **WHEN** a valid CMIS create-document request provides a parent folder, document name, MIME type, and content stream
- **THEN** the system stores the binary through ECMP static file storage and returns the mapped CMIS document object

#### Scenario: Reject invalid document create
- **WHEN** a CMIS create-document request violates ECMP file validation, media type, size, storage, or parent lookup rules
- **THEN** the system returns a CMIS-compatible error response mapped from the ECMP static file error

### Requirement: CMIS object deletion is supported for mapped resources
The system SHALL delete supported ECMP-backed CMIS objects using existing ECMP delete rules.

#### Scenario: Delete static file document
- **WHEN** a client deletes a CMIS document backed by an ECMP static file
- **THEN** the system deletes the static file metadata and stored binary through existing ECMP behavior

#### Scenario: Delete empty folder
- **WHEN** a client deletes a CMIS folder backed by an empty non-root ECMP folder
- **THEN** the system deletes the folder through existing ECMP behavior

#### Scenario: Reject unsupported delete
- **WHEN** a client deletes a root folder, non-empty folder, missing object, or unsupported object type
- **THEN** the system returns a CMIS-compatible error response mapped from the ECMP or adapter error

### Requirement: Unsupported CMIS services fail explicitly
The system SHALL return CMIS-compatible errors for CMIS services outside the supported first slice.

#### Scenario: Unsupported operation
- **WHEN** a client invokes CMIS query, changelog, relationships, policies, renditions, checkout/checkin, multifiling, unfiling, ACL mutation, retention, hold, AtomPub, or Web Services behavior
- **THEN** the system returns an explicit CMIS-compatible not-supported error response

### Requirement: CMIS authorization follows ECMP permissions
The system SHALL enforce ECMP authentication and authorization before executing CMIS operations.

#### Scenario: Authorized CMIS read
- **WHEN** an authenticated client with the required ECMP read permission requests a mapped CMIS object
- **THEN** the system returns the object representation

#### Scenario: Forbidden CMIS mutation
- **WHEN** an authenticated client lacks the required ECMP create, update, or delete permission for a CMIS mutation
- **THEN** the system rejects the request with a CMIS-compatible permission error response

#### Scenario: Allowable actions reflect permissions
- **WHEN** a CMIS object response includes allowable actions
- **THEN** the allowable actions reflect the caller's ECMP permissions and the object's current lifecycle constraints
