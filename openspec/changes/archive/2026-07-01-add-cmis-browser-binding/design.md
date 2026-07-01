## Context

ECMP already has the core resources that map naturally to CMIS: hierarchical folders, structured content records, static files with binary storage, content type schemas, gateway routing, and a permission model. The current public management API is REST and remains the primary platform API.

CMIS 1.1 defines multiple bindings. The Browser Binding is the most compatible initial target because it uses JSON, HTTP GET for reads, and HTTP POST for mutations. AtomPub and Web Services add XML/SOAP complexity without improving the first interoperability slice.

The CMIS implementation should be an adapter over existing ECMP application use cases. It must not introduce a second content model, bypass validation, or weaken authorization.

## Goals / Non-Goals

**Goals:**

- Expose a CMIS 1.1 Browser Binding-compatible management repository under `/api/cmis`.
- Map ECMP folders, static files, content records, and content type schemas into CMIS objects and type definitions.
- Support a minimal useful operation set for repository discovery, browsing, object lookup, document content streams, folder creation, document creation, and object deletion.
- Reuse existing Content Service and Content Type Service use cases through application ports or service clients.
- Return CMIS-shaped errors for unsupported services and invalid operations.
- Keep the existing ECMP REST API as the source of truth for native frontend and internal service workflows.

**Non-Goals:**

- Full CMIS 1.1 conformance certification in the first slice.
- AtomPub or Web Services/SOAP bindings.
- CMIS query, changelog, relationships, policies, renditions, checkout/checkin, multifiling/unfiling, ACL mutation, retention, or holds.
- Introducing MongoDB persistence solely for CMIS before the existing persistence roadmap.
- Changing ECMP's internal identifiers or domain model to look like CMIS.

## Decisions

### Use a Browser Binding adapter

The CMIS surface will be implemented as a Browser Binding adapter exposed through the API Gateway at `/api/cmis/*`. Browser Binding aligns with the existing NestJS and JSON/REST stack and avoids XML serializer complexity.

Alternatives considered:

- AtomPub: more historically common for CMIS clients, but requires Atom XML feeds and entries.
- Web Services: broad enterprise compatibility, but SOAP/WSDL support is heavyweight for the current scaffold.
- Native REST only: simplest, but does not satisfy standards-based CMIS client interoperability.

### Treat CMIS as an API compatibility layer

CMIS controllers and mappers will translate requests into existing ECMP use cases. ECMP remains responsible for folder rules, file validation, content validation, schema lifecycle, storage, authorization, and errors.

Alternatives considered:

- Add CMIS-specific repositories: risks duplicated rules and inconsistent state.
- Rename ECMP concepts to CMIS internally: would damage current feature boundaries and make the native API less clear.

### Expose one management repository first

The first implementation will expose one repository representing the ECMP Management Stage. Repository capabilities will be declared conservatively so clients can discover unsupported services.

Alternatives considered:

- One repository per content type: misleading because folders and files are shared platform resources.
- Separate management and delivery repositories: useful later, but delivery CMIS access needs publication behavior first.

### Map object identities without changing stored IDs

CMIS object IDs will preserve ECMP global IDs where possible: `FLD-*` for folders, `STF-*` for static files, and `RCD-*` for content records. CMIS type IDs will use stable values such as `cmis:folder`, `cmis:document`, and `ecmp:<content-type>`.

Alternatives considered:

- Generate opaque CMIS IDs: safer abstraction, but harder to debug and route.
- Prefix all CMIS IDs separately: more indirection without immediate value.

### Represent static files as CMIS documents

Static files are the first writable CMIS `cmis:document` representation because they already have binary streams, names, MIME types, folder assignment, and deletion behavior. Structured content records can be exposed as read-oriented CMIS objects or item-like custom objects until binary/document semantics are intentionally expanded.

Alternatives considered:

- Map content records to `cmis:document`: tempting, but structured JSON content does not currently have a primary binary stream.
- Hide content records from CMIS: simpler, but weakens repository browsing for ECMP's main authored content.

### Keep unsupported CMIS services explicit

Unsupported CMIS operations will return CMIS-compatible error payloads and status codes instead of HTTP 404 fallthrough or native ECMP error shapes. Repository info and type definitions will advertise conservative capabilities.

Alternatives considered:

- Stub unsupported operations as successful no-ops: dangerous and misleading for clients.
- Leave unsupported routes undefined: harder for CMIS clients to diagnose.

## Risks / Trade-offs

- [Risk] CMIS clients vary in how strictly they interpret Browser Binding details. -> Mitigate with contract tests against representative request/response examples from the CMIS 1.1 specification and by keeping repository capabilities conservative.
- [Risk] Static files and content records do not have identical lifecycle rules. -> Mitigate by documenting the mapping and implementing content record support as read-oriented until write semantics are designed.
- [Risk] CMIS type metadata can become stale if content type schemas change. -> Mitigate by reading active content type schemas through the Content Type Service at request time or through a cache with explicit invalidation later.
- [Risk] Authorization mismatches between CMIS allowable actions and ECMP RBAC can confuse clients. -> Mitigate by deriving allowable actions from the same permission checks used by native management APIs.
- [Risk] Browser Binding still has multipart and form-encoded mutation details. -> Mitigate with focused parser limits, payload size limits, and API contract tests for document creation and content stream handling.

## Migration Plan

1. Add the CMIS adapter behind new `/api/cmis/*` routes without changing existing `/api/management/*` routes.
2. Keep the feature disabled or undocumented for external clients until contract tests cover the supported operation set.
3. Advertise only implemented capabilities in repository info.
4. Roll back by removing gateway routing to the CMIS adapter; native ECMP APIs and stored content remain unchanged.

## Open Questions

- Should CMIS live in a new `cmis-service`, in the API Gateway, or as presentation adapters inside existing services?
- Which representative CMIS client should be used for manual compatibility checks?
- Should structured content records appear as `cmis:item`, custom document-like types without streams, or be deferred from the first externally supported surface?
- Should `/api/cmis` require the same browser session/auth flow as the Management Frontend, or support Basic/Bearer authentication profiles for external CMIS clients?
