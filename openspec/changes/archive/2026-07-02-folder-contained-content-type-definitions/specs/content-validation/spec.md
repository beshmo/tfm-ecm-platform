## MODIFIED Requirements

### Requirement: Resolve schema through application use case
The system SHALL validate content instances through an application use case that reads the appropriate content type schema from the Content Service schema repository.

#### Scenario: Latest active schema is used by default
- **WHEN** validation input omits `schemaVersion`
- **THEN** the use case reads the latest active schema for the requested content type from the local Content Service schema repository

#### Scenario: Explicit schema version is used when provided
- **WHEN** validation input includes `schemaVersion`
- **THEN** the use case reads that schema version for the requested content type from the local Content Service schema repository

#### Scenario: Missing schema throws application error
- **WHEN** the requested schema cannot be found
- **THEN** the use case throws a schema-not-found application error

#### Scenario: Schema resolution does not require Content Type Service HTTP
- **WHEN** content validation runs after content type schema ownership is merged into Content Service
- **THEN** validation resolves schemas without making an HTTP request to a standalone Content Type Service
