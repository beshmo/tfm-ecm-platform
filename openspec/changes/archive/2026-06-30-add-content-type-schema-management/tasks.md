## 1. YAML Size Configuration

- [x] 1.1 Add a content type schema YAML size configuration helper with a default of `65536` bytes and validation for invalid environment values.
- [x] 1.2 Make `StrictYamlSchemaParser` accept a configurable maximum source size while preserving the current default behavior.
- [x] 1.3 Add parser/config unit tests for default limits, configured limits, and oversized source rejection.

## 2. Content Type Service REST Writes

- [x] 2.1 Add schema source DTO validation for create and replace requests.
- [x] 2.2 Add `POST /api/management/content-types` to create schema versions from YAML source.
- [x] 2.3 Add `PUT /api/management/content-types/{name}/versions/{version}` to replace active schema versions from YAML source.
- [x] 2.4 Add `DELETE /api/management/content-types/{name}/versions/{version}` to soft deactivate schema versions.
- [x] 2.5 Map schema validation, duplicate, mismatch, inactive, not-found, and oversized request errors to the required HTTP responses.
- [x] 2.6 Add controller tests for successful create, replace, deactivate, explicit retrieval after deactivation, and all representative error mappings.

## 3. API Gateway Routing

- [x] 3.1 Ensure content type schema write requests are forwarded through the existing management proxy JSON path.
- [x] 3.2 Add gateway tests for schema create, replace, and deactivate forwarding, including method, path, body, status, and response body preservation.

## 4. Angular API Client

- [x] 4.1 Extend `ContentTypeApiClient` with create, replace, and deactivate methods using relative gateway URLs.
- [x] 4.2 Add frontend API client tests for write payloads, encoded name/version segments, and normalized validation/conflict/not-found/oversized errors.

## 5. Angular Administration UI

- [x] 5.1 Add a standalone content type schema administration page and route.
- [x] 5.2 Render active schema summaries and selected normalized schema details.
- [x] 5.3 Add create workflow with a YAML textarea, submit handling, list refresh, normalized schema display, and preserved input on failure.
- [x] 5.4 Add replace workflow with a YAML textarea for the selected schema version, submit handling, list refresh, normalized schema display, and preserved input on failure.
- [x] 5.5 Add deactivate workflow with confirmation, list refresh, cancellation handling, and not-found feedback.
- [x] 5.6 Add Angular route/component integration tests for schema list, detail viewing, create, replace, deactivate, cancellation, and inline validation feedback.

## 6. Documentation and Validation

- [x] 6.1 Document the new YAML payload size configuration in the relevant README or architecture documentation.
- [x] 6.2 Run `openspec validate add-content-type-schema-management`.
- [x] 6.3 Run `pnpm --filter @ecmp/content-type-service test`.
- [x] 6.4 Run `pnpm --filter @ecmp/api-gateway test`.
- [x] 6.5 Run `pnpm test:frontend`.
- [x] 6.6 Run `pnpm lint`.
