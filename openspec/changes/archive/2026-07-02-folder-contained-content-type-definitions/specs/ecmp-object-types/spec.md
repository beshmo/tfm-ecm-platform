## ADDED Requirements

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
