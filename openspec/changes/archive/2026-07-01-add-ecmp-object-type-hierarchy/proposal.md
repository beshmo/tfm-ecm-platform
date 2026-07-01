## Why

ECMP currently maps folders, static files, and user content schemas directly into CMIS type definitions without a first-class ECMP object-type hierarchy. Introducing ECMP object-type definitions makes the platform model explicit first, then lets CMIS become a standards projection of that model instead of the source of truth.

## What Changes

- Add an ECMP object-type hierarchy with a common `Object Type` root and concrete platform type definitions for folders, documents, and content type definitions.
- Rename the ECMP domain language for binary static-file content to `Document` in object-type and CMIS-facing documentation while preserving existing storage implementation details where needed.
- Model `Content Type Definition` as the common parent for all user-defined content type definitions.
- Map user content type definitions, such as `generic`, as descendants of `Content Type Definition` and CMIS `cmis:item` object-type definitions.
- Add common object-type attributes to ECMP object-type definitions and map those attributes to related CMIS object-type attributes.
- Keep folder, document, and content record instances tied to their concrete type definitions rather than inheriting directly from the generic object type.

## Capabilities

### New Capabilities
- `ecmp-object-types`: Defines the ECMP object-type hierarchy, common object-type attributes, platform type definitions, and instance-to-type relationships.

### Modified Capabilities
- `cmis-browser-binding`: CMIS type discovery and object mapping are sourced from ECMP object-type definitions, include the `cmis:item` content type hierarchy, and use `Document` terminology for binary content exposed as `cmis:document`.

## Impact

- Affects shared type contracts in `packages/shared-types` for ECMP object-type definitions and CMIS type mapping helpers.
- Affects CMIS adapter responses in `services/content-service` and proxy contract tests where type discovery is asserted.
- Affects documentation in `README.md`, `docs/architecture.md`, and OpenSpec specs to describe `Document` terminology and the object-type hierarchy.
- Does not require a persistence migration in this slice; object-type definitions can be generated from built-in platform types and active content type schemas.
