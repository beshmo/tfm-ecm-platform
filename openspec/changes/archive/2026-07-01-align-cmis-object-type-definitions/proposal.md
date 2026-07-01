## Why

ECMP now maps structured content records to CMIS item-based custom types, but CMIS type discovery still only advertises folder and document base types. CMIS 1.1 also requires every object-type definition to expose a common set of type attributes, so the current reduced type shape can make standards-based clients see an incomplete repository model.

## What Changes

- Advertise the `cmis:item` base object type when ECMP exposes structured content records as item descendants.
- Expand CMIS type definitions to include the common object-type attributes required by CMIS 1.1 section `2.1.3.2.1`.
- Set stable parent/type hierarchy metadata for base types and ECMP custom content record types.
- Keep `cmis:relationship`, `cmis:policy`, and `cmis:secondary` unadvertised until ECMP has backing domain behavior for them.
- Keep query, relationship, policy, ACL mutation, versioning, and other unsupported services explicitly unsupported.
- Add contract tests that assert the type discovery response includes `cmis:item` and the required common attributes for every returned type.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `cmis-browser-binding`: Align CMIS type discovery and object-type definition metadata with CMIS 1.1 object and object-type requirements.

## Impact

- Shared CMIS DTOs and mapping helpers in `packages/shared-types`.
- Content Service CMIS type discovery responses under `/api/cmis/:repositoryId/types`.
- CMIS controller and shared mapping tests.
- CMIS compatibility documentation in `README.md`, `docs/architecture.md`, and the main `cmis-browser-binding` OpenSpec capability.
