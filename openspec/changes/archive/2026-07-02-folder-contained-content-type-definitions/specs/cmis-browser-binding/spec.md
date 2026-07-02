## ADDED Requirements

### Requirement: CMIS exposure of schema objects is explicit
The system SHALL not expose `/system/schemas` or content type definition repository objects through CMIS navigation in this slice unless a supported CMIS operation explicitly requires type discovery metadata.

#### Scenario: CMIS type discovery still lists user content types
- **WHEN** a CMIS client requests type definitions
- **THEN** the system continues to expose active user content type schemas as CMIS custom type definitions

#### Scenario: CMIS folder children omit schema administration objects
- **WHEN** a CMIS client requests folder children for the repository root or another supported authoring folder
- **THEN** the system does not include `/system/schemas` administrative schema objects as normal authoring children

#### Scenario: CMIS object path does not expose schema namespace
- **WHEN** a CMIS client resolves an object by a `/system/schemas` path
- **THEN** the system returns a CMIS-compatible not-found or permission error response
