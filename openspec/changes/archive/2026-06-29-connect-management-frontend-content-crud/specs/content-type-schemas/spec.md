## ADDED Requirements

### Requirement: Content type schema read REST API is exposed
The system SHALL expose read-only Content Type Service management endpoints for listing active schemas and retrieving schema definitions.

#### Scenario: List active schemas endpoint
- **WHEN** a valid `GET /api/management/content-types` request is made
- **THEN** the system responds with status `200` and active content type schema summaries

#### Scenario: Retrieve latest schema endpoint
- **WHEN** a valid `GET /api/management/content-types/{name}` request retrieves an existing active content type
- **THEN** the system responds with status `200` and the latest active schema definition

#### Scenario: Retrieve explicit schema version endpoint
- **WHEN** a valid `GET /api/management/content-types/{name}/versions/{version}` request retrieves an existing schema version
- **THEN** the system responds with status `200` and that schema definition

#### Scenario: Map missing schema read
- **WHEN** a content type schema read request targets a missing schema
- **THEN** the system responds with status `404`

### Requirement: Content type schema reads are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/content-types` to the Content Type Service.

#### Scenario: Gateway forwards schema list
- **WHEN** the API Gateway receives `GET /api/management/content-types`
- **THEN** it forwards the request to the Content Type Service and returns the service status and response body

#### Scenario: Gateway forwards schema detail
- **WHEN** the API Gateway receives `GET /api/management/content-types/{name}` or `GET /api/management/content-types/{name}/versions/{version}`
- **THEN** it forwards the request to the Content Type Service and returns the service status and response body

## MODIFIED Requirements

### Requirement: Keep presentation and persistence deferred

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
