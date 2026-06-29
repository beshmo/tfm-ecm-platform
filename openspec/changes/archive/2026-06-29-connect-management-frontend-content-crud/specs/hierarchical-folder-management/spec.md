## ADDED Requirements

### Requirement: Folder management APIs are routed through the gateway
The system SHALL route API Gateway requests under `/api/management/folders` to the Content Service.

#### Scenario: Gateway forwards folder list
- **WHEN** the API Gateway receives `GET /api/management/folders` with or without query parameters
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway forwards folder detail
- **WHEN** the API Gateway receives `GET /api/management/folders/{folderId}`
- **THEN** it forwards the request to the Content Service and returns the service status and response body

#### Scenario: Gateway preserves folder API errors
- **WHEN** the Content Service responds with a folder validation, not-found, or conflict error
- **THEN** the API Gateway returns the same status code and response body to the caller
