## Why

Content type schemas are currently a flat registry owned by a separate Content Type Service, while folders, content records, documents, CMIS navigation, and folder occupancy are owned by the Content Service. Organizing schemas under `/system/schemas` makes schemas repository objects, so keeping them in a separate service would introduce cross-service consistency problems for moves, deletes, validation, and administration.

## What Changes

- Merge content type schema ownership into the Content Service so content validation, schema administration, and repository navigation use a single service boundary.
- Model user content type definitions as folder-contained repository objects under the protected `/system/schemas` namespace.
- Create reserved `/system` and `/system/schemas` folders during setup and reject rename, move, or delete operations for those folders.
- Allow admins to create schema subfolders under `/system/schemas` and move content type definition objects between those subfolders.
- Update folder occupancy so schema folders cannot be deleted while they contain child folders or content type definition objects.
- Preserve existing content type schema parsing, version lifecycle, active lookup, explicit version retrieval, YAML size limits, and soft deactivation behavior.
- Route content type management API requests to the Content Service instead of the Content Type Service.
- Update the management frontend content type administration screen so admins can browse `/system/schemas` and administer schemas in folder context.
- **BREAKING**: `content-type-service` is removed as an independently deployed runtime service; callers must use the API Gateway or Content Service management API for content type schema operations.

## Capabilities

### New Capabilities

- `folder-contained-content-type-definitions`: Defines content type definition objects stored under `/system/schemas`, including admin-only schema folder organization and schema move behavior.

### Modified Capabilities

- `content-type-schemas`: Content type schema management moves from the Content Type Service to the Content Service and gains folder-contained repository object identity while preserving schema version behavior.
- `hierarchical-folder-management`: Folder management gains reserved `/system` and `/system/schemas` folders plus schema-object occupancy rules.
- `ecmp-object-types`: Content type definitions become concrete repository object instances under the ECMP object-type model, not only type metadata.
- `cmis-browser-binding`: CMIS navigation and type discovery must account for content type definitions being repository objects while keeping supported CMIS exposure explicit.
- `content-validation`: Content validation resolves schemas from the local Content Service schema repository instead of an HTTP Content Type Service dependency.
- `management-content-authoring`: The management frontend gains admin schema folder exploration and schema administration under `/system/schemas`.

## Impact

- Backend service boundary changes in `services/content-service`, `services/content-type-service`, and `services/api-gateway`.
- Shared DTO and ID types may need a content type definition object identity, such as a new `CTD-` global ID prefix.
- Content Service dependency injection changes from `HttpContentTypeSchemaReader` to a local schema repository/reader.
- Folder domain/application rules gain protected system folders and schema occupancy checks.
- Management frontend content type administration changes from a flat list to a folder-scoped admin workspace.
- Docker Compose, package scripts, service URLs, gateway tests, and backend focused test commands must stop requiring a standalone Content Type Service runtime.
