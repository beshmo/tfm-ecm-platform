## MODIFIED Requirements

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

## ADDED Requirements

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
