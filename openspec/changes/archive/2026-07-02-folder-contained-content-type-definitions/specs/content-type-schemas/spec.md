## ADDED Requirements

### Requirement: Content Service owns schema management runtime
The system SHALL expose content type schema management from the Content Service runtime while preserving the existing content type schema API behavior.

#### Scenario: Content Service lists active schemas
- **WHEN** a valid `GET /api/management/content-types` request is handled after this change
- **THEN** the Content Service returns active content type schema summaries with the same response shape as the previous content type schema API

#### Scenario: Content Service retrieves schema version
- **WHEN** a valid `GET /api/management/content-types/{name}/versions/{version}` request retrieves an existing schema version
- **THEN** the Content Service returns that normalized schema definition with fields in explicit schema order

#### Scenario: Content Service writes schema versions
- **WHEN** valid schema create, replace, or deactivate requests are handled after this change
- **THEN** the Content Service applies the existing YAML parsing, version lifecycle, conflict, not-found, and validation error behavior

### Requirement: Schema definitions expose folder location
The system SHALL expose enough metadata for administrators to understand and change the folder location of content type definitions under `/system/schemas`.

#### Scenario: Administrative schema list by folder
- **WHEN** an administrator lists content type definitions for a schema folder
- **THEN** the system returns only definitions assigned to that folder with their active version summary information

#### Scenario: Existing active summary behavior remains available
- **WHEN** a content authoring workflow lists active content type schemas without a folder filter
- **THEN** the system returns active schema summaries suitable for choosing a content type without requiring schema folder navigation

## MODIFIED Requirements

### Requirement: Content type schema reads are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/content-types` to the Content Service.

#### Scenario: Gateway forwards schema list
- **WHEN** the API Gateway receives `GET /api/management/content-types`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway forwards schema detail
- **WHEN** the API Gateway receives `GET /api/management/content-types/{name}` or `GET /api/management/content-types/{name}/versions/{version}`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

### Requirement: Content type schema writes are routed through the gateway
The system SHALL route API Gateway write requests under `/api/management/content-types` to the Content Service.

#### Scenario: Gateway forwards schema create
- **WHEN** the API Gateway receives `POST /api/management/content-types` with a JSON schema source DTO
- **THEN** it forwards the request to the Content Service and returns the downstream status and response body

#### Scenario: Gateway forwards schema replace
- **WHEN** the API Gateway receives `PUT /api/management/content-types/{name}/versions/{version}` with a JSON schema source DTO
- **THEN** it forwards the method, path, and request body to the Content Service

#### Scenario: Gateway forwards schema deactivate
- **WHEN** the API Gateway receives `DELETE /api/management/content-types/{name}/versions/{version}`
- **THEN** it forwards the method and path to the Content Service and returns the downstream status
