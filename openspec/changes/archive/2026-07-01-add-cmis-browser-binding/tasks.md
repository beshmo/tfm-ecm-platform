## 1. Contracts And Mapping

- [x] 1.1 Define the supported CMIS Browser Binding operation set and repository capability values for the first slice.
- [x] 1.2 Add CMIS response and error DTOs in the selected shared/package boundary.
- [x] 1.3 Implement CMIS object ID, type ID, property, allowable-actions, and error mapping utilities.
- [x] 1.4 Map ECMP folders, static files, content records, and content type schemas into CMIS object and type representations.

## 2. CMIS Adapter

- [x] 2.1 Add a CMIS adapter/controller module for repository info and service document responses.
- [x] 2.2 Implement CMIS type discovery for base platform types and active ECMP content type schemas.
- [x] 2.3 Implement CMIS navigation for folder children, object-by-ID lookup, and object-by-path lookup.
- [x] 2.4 Implement static-file-backed content stream retrieval.
- [x] 2.5 Implement CMIS folder creation by delegating to existing folder use cases.
- [x] 2.6 Implement CMIS document creation by delegating to existing static file upload/storage use cases.
- [x] 2.7 Implement CMIS object deletion for supported folder and static file objects.
- [x] 2.8 Implement explicit CMIS not-supported responses for out-of-scope services.

## 3. Gateway And Authorization

- [x] 3.1 Route `/api/cmis/*` requests through the API Gateway to the CMIS adapter.
- [x] 3.2 Preserve query strings, form bodies, multipart bodies, and required content headers for CMIS Browser Binding requests.
- [x] 3.3 Enforce ECMP authentication and authorization for CMIS read and mutation operations.
- [x] 3.4 Derive CMIS allowable actions from ECMP permissions and object lifecycle constraints.

## 4. Tests

- [x] 4.1 Add unit tests for CMIS type, object, property, allowable-action, and error mapping.
- [x] 4.2 Add adapter/controller contract tests for repository info, type discovery, navigation, object lookup, content stream retrieval, folder creation, document creation, deletion, and unsupported operations.
- [x] 4.3 Add gateway routing tests for CMIS read, form, and multipart forwarding.
- [x] 4.4 Add authorization tests for allowed reads, forbidden mutations, and allowable-actions output.
- [x] 4.5 Add regression tests that existing `/api/management/*` routes remain unchanged.

## 5. Documentation And Validation

- [x] 5.1 Update README and architecture documentation with the CMIS compatibility surface, scope, and non-goals.
- [x] 5.2 Document the initial CMIS object/type mapping and unsupported CMIS services.
- [x] 5.3 Run OpenSpec validation for `add-cmis-browser-binding`.
- [x] 5.4 Run the relevant typecheck, lint, test, and build gates after implementation.
