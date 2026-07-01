## MODIFIED Requirements

### Requirement: CMIS type definitions map ECMP platform types
The system SHALL expose CMIS type definitions projected from ECMP object-type definitions for ECMP folders, documents, and supported structured content records.

#### Scenario: List base type children
- **WHEN** a client requests CMIS type children for the repository root type scope
- **THEN** the system returns type definitions including `cmis:folder`, `cmis:document`, `cmis:item`, `ecmp:content-type-definition`, and supported ECMP user content types

#### Scenario: Map folder type definition
- **WHEN** the ECMP Folder Type is exposed through CMIS type discovery
- **THEN** the system maps it to the `cmis:folder` object-type definition

#### Scenario: Map document type definition
- **WHEN** the ECMP Document Type is exposed through CMIS type discovery
- **THEN** the system maps it to the `cmis:document` object-type definition with required content stream metadata

#### Scenario: Map content type definition parent
- **WHEN** the ECMP Content Type Definition parent is exposed through CMIS type discovery
- **THEN** the system maps it to `ecmp:content-type-definition` with base type `cmis:item` and parent type `cmis:item`

#### Scenario: Map user content type schema to custom type
- **WHEN** an active ECMP user content type schema is exposed through CMIS type discovery
- **THEN** the system maps the schema to a stable CMIS custom type identifier with base type `cmis:item`, parent type `ecmp:content-type-definition`, and supported field definitions as CMIS properties

#### Scenario: Do not advertise unsupported optional base types
- **WHEN** CMIS type discovery returns base and custom type definitions
- **THEN** the system does not advertise `cmis:relationship`, `cmis:policy`, or `cmis:secondary`

### Requirement: CMIS objects map ECMP resources
The system SHALL map ECMP resource metadata into CMIS object representations using each resource's concrete ECMP object type.

#### Scenario: Map folder object
- **WHEN** a CMIS response includes an ECMP folder
- **THEN** the object has base type `cmis:folder`, object ID equal to the folder ID, name equal to the folder name or `/` for root, and parent metadata matching the folder hierarchy

#### Scenario: Map document object
- **WHEN** a CMIS response includes an ECMP document backed by stored binary content
- **THEN** the object has base type `cmis:document`, object ID equal to the document ID, name equal to the filename, and content stream metadata from the stored document metadata

#### Scenario: Map content record object
- **WHEN** a CMIS response includes an ECMP content record
- **THEN** the object has a stable CMIS type derived from its user content type and includes supported record metadata and schema fields as properties

## ADDED Requirements

### Requirement: CMIS object-type definitions include common attributes
The system SHALL include CMIS 1.1 common object-type attributes on every CMIS type definition returned by the ECMP CMIS adapter.

#### Scenario: Common attributes are returned for built-in types
- **WHEN** CMIS type discovery returns `cmis:folder`, `cmis:document`, `cmis:item`, or `ecmp:content-type-definition`
- **THEN** each type definition includes `id`, `localName`, `localNamespace`, `queryName`, `displayName`, `baseId`, `parentId`, `description`, `creatable`, `fileable`, `queryable`, `controllablePolicy`, `controllableACL`, `fulltextIndexed`, `includedInSupertypeQuery`, and `typeMutability`

#### Scenario: Common attributes are returned for user content types
- **WHEN** CMIS type discovery returns a user content type such as `ecmp:generic`
- **THEN** the type definition includes all common object-type attributes and uses `parentId` equal to `ecmp:content-type-definition`

#### Scenario: Unsupported behavior flags remain conservative
- **WHEN** common CMIS object-type attributes are returned
- **THEN** unsupported query, policy, ACL, full-text, and type mutability flags are set to false
