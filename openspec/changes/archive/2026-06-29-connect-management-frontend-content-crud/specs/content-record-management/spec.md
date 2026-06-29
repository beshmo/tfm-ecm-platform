## ADDED Requirements

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
