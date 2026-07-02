## Purpose

Define the ECMP object-type hierarchy: an internal `Object Type` root with concrete built-in child type definitions (`Folder Type`, `Document Type`, `Content Type Definition`) that user content types extend. This hierarchy gives every ECMP resource a concrete object type, defines the common attributes each object-type definition exposes, and establishes a deterministic mapping from ECMP object-type attributes to CMIS object-type attributes so ECMP resources can be projected onto CMIS-compatible surfaces.

## Requirements

### Requirement: ECMP object-type hierarchy is defined
The system SHALL define an ECMP object-type hierarchy with an internal `Object Type` root and concrete child type definitions for `Folder Type`, `Document Type`, and `Content Type Definition`.

#### Scenario: Built-in platform type hierarchy
- **WHEN** ECMP object-type definitions are listed
- **THEN** the built-in hierarchy includes `Object Type` as the internal root and `Folder Type`, `Document Type`, and `Content Type Definition` as child type definitions

#### Scenario: User content type definitions extend content type definition
- **WHEN** an active user content type definition such as `generic` is represented as an ECMP object-type definition
- **THEN** its parent type is `Content Type Definition`

### Requirement: ECMP object-type definitions expose common attributes
The system SHALL define common object-type attributes for every ECMP object-type definition, including `id`, `localName`, `localNamespace`, `queryName`, `displayName`, `parentId`, `description`, `creatable`, `fileable`, `queryable`, `controllablePolicy`, `controllableACL`, `fulltextIndexed`, `includedInSupertypeQuery`, and `typeMutability`.

#### Scenario: Built-in object type includes common attributes
- **WHEN** the Folder Type, Document Type, or Content Type Definition is returned
- **THEN** the type definition includes every common object-type attribute with explicit values

#### Scenario: User content type includes common attributes
- **WHEN** a user content type definition is returned
- **THEN** the type definition includes every common object-type attribute with explicit values and a parent ID pointing to Content Type Definition

### Requirement: ECMP instances reference concrete object types
The system SHALL associate each ECMP resource instance with its concrete object-type definition rather than directly with the internal `Object Type` root.

#### Scenario: Folder instance uses folder type
- **WHEN** a folder instance is represented through object-type metadata
- **THEN** it references Folder Type as its concrete type

#### Scenario: Document instance uses document type
- **WHEN** a binary content object is represented through object-type metadata
- **THEN** it references Document Type as its concrete type

#### Scenario: Content record instance uses user content type
- **WHEN** a content record instance of `generic` is represented through object-type metadata
- **THEN** it references the `generic` user content type definition as its concrete type

### Requirement: Binary content object-type terminology uses Document
The system SHALL use `Document` terminology for the ECMP object type that represents binary content with a content stream.

#### Scenario: Document type describes binary content
- **WHEN** ECMP object-type definitions describe binary content with stored bytes and metadata
- **THEN** the type is named Document Type rather than the deprecated binary asset term

#### Scenario: Existing storage compatibility remains internal
- **WHEN** implementation details still use legacy file storage names or existing file routes
- **THEN** those names remain compatibility or storage details and do not change the ECMP object-type name Document

### Requirement: ECMP object-type attributes map to CMIS object-type attributes
The system SHALL provide a deterministic mapping from ECMP object-type common attributes to related CMIS object-type attributes.

#### Scenario: Common attributes map by name
- **WHEN** an ECMP object-type definition is projected to CMIS
- **THEN** common ECMP attributes map to the related CMIS attributes with the same semantic names

#### Scenario: ECMP internal root is not projected as a CMIS base type
- **WHEN** ECMP object-type definitions are projected to CMIS type discovery
- **THEN** the internal Object Type root is not exposed as an additional CMIS base type

### Requirement: Content type definition instances are repository objects
The system SHALL associate each user content type definition instance with the `Content Type Definition` object type and a repository folder location.

#### Scenario: Content type definition object uses content type definition type
- **WHEN** a user content type definition such as `article` is represented as a repository object
- **THEN** it references the ECMP Content Type Definition type as its concrete object type

#### Scenario: Content type definition object has folder location
- **WHEN** a content type definition object is returned through repository administration APIs
- **THEN** the object includes its assigned schema folder location under `/system/schemas`

### Requirement: User content record types remain derived from active schema versions
The system SHALL continue to derive content record object type metadata from active user content type schemas.

#### Scenario: Content record keeps user content type
- **WHEN** a content record instance of `article` is represented through object-type metadata
- **THEN** it references the user content type derived from the active `article` schema rather than the folder-contained definition object itself
