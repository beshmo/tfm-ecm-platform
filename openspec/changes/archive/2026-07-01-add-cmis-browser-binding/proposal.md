## Why

ECMP should support standards-based repository access so compatible enterprise content clients can browse folders, inspect objects, and exchange documents without depending on the platform's internal REST API. CMIS 1.1 is a good fit because it is designed as an interoperability layer over existing content management systems rather than a replacement for their internal domain model.

## What Changes

- Add a CMIS 1.1 Browser Binding compatibility surface as an adapter over ECMP's existing management content capabilities.
- Expose a single ECMP management repository through CMIS repository information and repository/root-folder URLs.
- Map ECMP folders to `cmis:folder` objects, static files to `cmis:document` objects with content streams, and structured content records to read-oriented CMIS objects.
- Provide initial CMIS navigation and object operations for repository info, type discovery, folder children, object lookup by ID, object lookup by path, content stream retrieval, folder creation, document creation, and object deletion.
- Return CMIS-compatible error responses for unsupported services and invalid operations instead of silently falling back to ECMP-specific behavior.
- Keep AtomPub, Web Services/SOAP, CMIS query, changelog, relationships, policies, renditions, checkout/checkin, multifiling/unfiling, ACL mutation, and full CMIS conformance testing out of scope for the first slice.
- Update README and architecture documentation to describe CMIS as a standards-based compatibility API alongside the existing REST APIs.

## Capabilities

### New Capabilities

- `cmis-browser-binding`: CMIS Browser Binding repository metadata, type mapping, object navigation, object creation/deletion, content stream retrieval, unsupported-service behavior, and gateway routing.

### Modified Capabilities

- None.

## Impact

- Affects the API Gateway by adding `/api/cmis/*` routing to a CMIS adapter/controller.
- Affects the Content Service through read/write use case reuse for folders, static files, and content records.
- Affects the Content Type Service through read-only type definition mapping from ECMP content type schemas into CMIS type metadata.
- Affects shared contracts if CMIS response DTOs, object/type identifiers, and error shapes are centralized in `packages/shared-types` or a future shared CMIS package.
- Affects documentation in `README.md` and `docs/architecture.md` by adding CMIS compatibility as a planned API surface.
- Adds API contract tests for CMIS Browser Binding endpoints, object/type mapping, unsupported operations, and error responses.
