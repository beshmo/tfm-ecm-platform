## ADDED Requirements

### Requirement: Content type schema write REST API is exposed
The system SHALL expose Content Type Service management endpoints for creating, replacing, and soft deactivating content type schema versions.

#### Scenario: Create schema version endpoint
- **WHEN** a valid `POST /api/management/content-types` request sends YAML schema source for a new `name + version`
- **THEN** the system responds with status `201`, stores the schema version, and returns the normalized schema definition

#### Scenario: Replace schema version endpoint
- **WHEN** a valid `PUT /api/management/content-types/{name}/versions/{version}` request sends YAML schema source matching the requested schema identity
- **THEN** the system responds with status `200`, replaces the active schema version, and returns the normalized schema definition

#### Scenario: Deactivate schema version endpoint
- **WHEN** a valid `DELETE /api/management/content-types/{name}/versions/{version}` request targets an existing schema version
- **THEN** the system soft deactivates the schema version and responds with status `204`

#### Scenario: Deactivated version remains explicitly retrievable
- **WHEN** a deactivated schema version is requested through `GET /api/management/content-types/{name}/versions/{version}`
- **THEN** the system responds with status `200` and the normalized schema definition for that inactive version

### Requirement: Schema write requests use YAML source DTOs
The system SHALL accept schema create and replace requests as JSON DTOs containing author-facing YAML schema source text.

#### Scenario: JSON envelope carries YAML source
- **WHEN** a schema create or replace request sends `{ "schemaSource": "<yaml>" }`
- **THEN** the system parses `schemaSource` as YAML and applies schema validation rules before storing the normalized definition

#### Scenario: Missing schema source is rejected
- **WHEN** a schema create or replace request omits `schemaSource` or sends a non-string value
- **THEN** the system responds with status `400` and a sanitized validation message

#### Scenario: Invalid YAML returns structured validation feedback
- **WHEN** a schema create or replace request sends invalid YAML or a schema that violates schema validation rules
- **THEN** the system responds with status `400`, a sanitized error message, and validation messages suitable for display in the Management Frontend

#### Scenario: Duplicate schema create is rejected
- **WHEN** a schema create request targets a `name + version` that already exists
- **THEN** the system responds with status `409`

#### Scenario: Replacement identity mismatch is rejected
- **WHEN** a schema replace request sends YAML with a different `name` or `version` than the requested path
- **THEN** the system responds with status `409`

#### Scenario: Inactive schema replacement is rejected
- **WHEN** a schema replace request targets an inactive schema version
- **THEN** the system responds with status `409`

#### Scenario: Missing schema write target is rejected
- **WHEN** a schema replace or deactivate request targets a missing schema version
- **THEN** the system responds with status `404`

### Requirement: Content type schema writes are routed through the gateway
The system SHALL route API Gateway write requests under `/api/management/content-types` to the Content Type Service.

#### Scenario: Gateway forwards schema create
- **WHEN** the API Gateway receives `POST /api/management/content-types` with a JSON schema source DTO
- **THEN** it forwards the request to the Content Type Service and returns the downstream status and response body

#### Scenario: Gateway forwards schema replace
- **WHEN** the API Gateway receives `PUT /api/management/content-types/{name}/versions/{version}` with a JSON schema source DTO
- **THEN** it forwards the method, path, and request body to the Content Type Service

#### Scenario: Gateway forwards schema deactivate
- **WHEN** the API Gateway receives `DELETE /api/management/content-types/{name}/versions/{version}`
- **THEN** it forwards the method and path to the Content Type Service and returns the downstream status

### Requirement: YAML schema payload size is configurable
The system SHALL enforce a configurable maximum size for author-facing YAML schema source text used in production management requests.

#### Scenario: Default YAML source size limit is applied
- **WHEN** no explicit YAML schema size configuration is provided
- **THEN** the system uses a safe default maximum of `65536` bytes for schema source text

#### Scenario: Configured YAML source size limit is applied
- **WHEN** the runtime config sets a maximum YAML schema source size
- **THEN** schema create and replace requests use that configured limit before YAML parsing

#### Scenario: Oversized schema request is rejected
- **WHEN** a schema create or replace request sends `schemaSource` larger than the configured maximum
- **THEN** the system responds with status `413` without parsing or storing the schema

#### Scenario: Parser retains size defense
- **WHEN** schema source larger than the configured parser limit is parsed outside the HTTP request path
- **THEN** the parser rejects the input with a sanitized schema validation error before parsing YAML

### Requirement: Durable schema persistence remains deferred
The system SHALL keep MongoDB-backed content type schema persistence deferred while exposing schema management through the existing in-memory repository for this phase.

#### Scenario: MongoDB persistence is not introduced
- **WHEN** this change is implemented
- **THEN** no MongoDB repository, collection migration, or database integration is introduced for content type schemas

## REMOVED Requirements

### Requirement: Keep presentation and persistence deferred
**Reason**: Phase 3 now requires REST write presentation and Angular administration for content type schemas.
**Migration**: Replace the deferred presentation constraint with write REST API, gateway routing, DTO validation, and Angular YAML textarea administration requirements while still deferring MongoDB persistence.

The system SHALL keep write-side content type schema presentation, Angular content type administration, and MongoDB persistence deferred while allowing read-only REST endpoints for schema discovery.

#### Scenario: Write REST endpoints are not added
- **WHEN** this change is implemented
- **THEN** no content type create, replace, or deactivate REST endpoints are introduced

#### Scenario: Read REST endpoints are added
- **WHEN** this change is implemented
- **THEN** content type list, latest read, and explicit version read REST endpoints are introduced

#### Scenario: MongoDB persistence is not added
- **WHEN** this change is implemented
- **THEN** no MongoDB repository, collection migration, or database integration is introduced

#### Scenario: Angular content type administration is not added
- **WHEN** this change is implemented
- **THEN** no Angular screens for creating, replacing, or deactivating content type schemas are introduced
