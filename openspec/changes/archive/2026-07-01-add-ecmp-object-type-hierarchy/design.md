## Context

ECMP already has distinct resource instances for folders, static-file-backed binary assets, and structured content records. It also has content type schemas and a CMIS Browser Binding adapter that maps those resources into CMIS type and object responses. The missing piece is an ECMP-native object-type definition model: CMIS currently carries type hierarchy metadata that should belong to the platform first.

The intended hierarchy is:

```text
Object Type
  |-- Folder Type
  |    `-- Folder instance
  |-- Document Type
  |    `-- Document instance
  `-- Content Type Definition
       |-- Generic Content Type
       |    `-- Content record instance of Generic
       `-- Some Other User Content Type
            `-- Content record instance of Some Other Type
```

CMIS does not have a generic `Object Type` base type, so the ECMP root type remains an internal platform abstraction. CMIS type discovery projects supported concrete branches into CMIS base types and subtypes.

## Goals / Non-Goals

**Goals:**

- Define ECMP object-type definitions with common metadata shared by Folder Type, Document Type, Content Type Definition, and user content type definitions.
- Use `Document` as the domain name for binary content objects that are exposed to CMIS as `cmis:document`.
- Make `Content Type Definition` the parent type for every user-defined content type.
- Map ECMP object-type common attributes to CMIS object-type common attributes.
- Expose `cmis:item`, `ecmp:content-type-definition`, and user content type definitions in CMIS type discovery.

**Non-Goals:**

- Replace existing storage implementation names, database field names, or management `/api/management/files` routes in this slice.
- Add CMIS query, relationship, policy, secondary type, ACL mutation, or type management services.
- Make clients create, update, or delete ECMP object-type definitions through CMIS.
- Add persistence for built-in object-type definitions.

## Decisions

### ECMP owns the object-type hierarchy

ECMP will define an internal `Object Type` root with concrete platform type definitions beneath it. Runtime resource instances reference their concrete type definition: folder instances reference Folder Type, document instances reference Document Type, and content records reference the user content type definition selected at creation.

Alternative considered: keep CMIS type definitions as the only type metadata. That keeps the current implementation smaller, but it makes the CMIS adapter the de facto source of truth for platform semantics.

### Document replaces static file in domain-facing type language

The object-type model will use `Document Type` and `Document instance` for binary content. Existing storage and REST compatibility names can remain where changing them would create unrelated churn or breaking API changes.

Alternative considered: rename every static-file implementation symbol and route immediately. That is cleaner eventually, but it is larger than this object-type/CMIS alignment and would need a compatibility plan.

### Content Type Definition is a structural parent

`Content Type Definition` will be an ECMP object-type definition and a CMIS `cmis:item` subtype. User content types, such as `generic`, will be descendants of it. Content record instances will use concrete user content types, not the abstract parent.

CMIS projection:

```text
cmis:item
  `-- ecmp:content-type-definition
       |-- ecmp:generic
       `-- ecmp:<user-content-type>
```

### Common attributes use CMIS-compatible names

ECMP object-type definitions will include common attributes that map directly to CMIS object-type attributes: `id`, `localName`, `localNamespace`, `queryName`, `displayName`, `baseId`, `parentId`, `description`, `creatable`, `fileable`, `queryable`, `controllablePolicy`, `controllableACL`, `fulltextIndexed`, `includedInSupertypeQuery`, and `typeMutability`.

ECMP may store or generate additional internal fields later, but the first slice should keep the contract close to CMIS 1.1 so projection is deterministic.

### Conservative behavior flags

The first implementation will set unsupported behavior flags conservatively: no query, no ACL mutation, no policy control, no full-text query indexing, and no client-managed type mutability. Folder and document creation remain supported through existing operations; content record creation remains through ECMP management APIs unless a later CMIS create-item slice is designed.

## Risks / Trade-offs

- [Risk] Keeping storage/API compatibility names for files while introducing `Document` domain language can create mixed terminology. -> Mitigate by documenting that `Document` is the object-type/domain term and existing file/static-file names are compatibility or storage terms until a dedicated rename migration.
- [Risk] Adding a hierarchy can imply inheritance behavior that does not exist yet. -> Mitigate by defining inheritance for type metadata and property definitions only; runtime behavior remains owned by existing folder, document, and content use cases.
- [Risk] CMIS clients may expect type management if `typeMutability` appears. -> Mitigate by setting all type mutability flags to `false` and returning explicit not-supported errors for type management services.
- [Risk] User content types under `ecmp:content-type-definition` may be mistaken for documents with content streams. -> Mitigate by projecting them as `cmis:item` descendants with `contentStreamAllowed: "notallowed"` and no versioning support.
