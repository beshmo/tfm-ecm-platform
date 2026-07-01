## Context

ECMP exposes a CMIS Browser Binding adapter over existing management resources. The current adapter maps folders to `cmis:folder`, static files to `cmis:document`, and structured content records to custom ECMP types with `cmis:item` as their base type.

The current type discovery response is narrower than that model. It advertises `cmis:folder` and `cmis:document`, while content record schemas are returned as `cmis:item` descendants. The shared `CmisTypeDefinition` DTO also omits several common object-type attributes that CMIS 1.1 section `2.1.3.2.1` requires every object-type definition to contain.

## Goals / Non-Goals

**Goals:**

- Make CMIS type discovery internally consistent with ECMP's item-based content record mapping.
- Add `cmis:item` to advertised base object types when item descendants are exposed.
- Return stable common object-type attributes for every CMIS type definition.
- Keep conservative capability flags aligned with unsupported query, policy, ACL mutation, and type mutation behavior.
- Preserve existing CMIS object mapping, gateway routing, and native management REST APIs.

**Non-Goals:**

- Implement CMIS relationships, policies, secondary types, or query services.
- Add CMIS type creation, type update, or type deletion.
- Change ECMP persistence, folder rules, content record rules, or static file storage.
- Pursue full CMIS conformance certification.

## Decisions

### Expose `cmis:item` because ECMP exposes item descendants

ECMP content records already map to custom object types with `baseId: "cmis:item"`. The adapter should therefore include the `cmis:item` base type in type discovery. This keeps the type hierarchy discoverable and aligns with CMIS 1.1 behavior for repositories that support item objects.

Alternative considered: map content records to `cmis:document` without a content stream. That would blur the ECMP distinction between binary static files and structured content records, and would make content stream semantics less clear.

### Keep unsupported optional base types unadvertised

The adapter should not advertise `cmis:relationship`, `cmis:policy`, or `cmis:secondary` until ECMP has backing domain behavior for them. Their services remain explicit `notSupported` responses.

Alternative considered: include all CMIS base types with disabled flags. That could mislead clients into attempting relationship, policy, or secondary type workflows that ECMP does not support.

### Add common object-type attributes with conservative defaults

Every `CmisTypeDefinition` should include the common attributes required by CMIS 1.1 section `2.1.3.2.1`: identity, hierarchy, display, behavior flags, indexing flags, and type mutability. Unsupported optional values should be represented consistently as `null` where a value is not set.

Conservative defaults:

- `parentId: null` for base types.
- `parentId: "cmis:item"` for ECMP content record custom types.
- `localNamespace: "https://ecmp.local/cmis/types"` for ECMP-owned types.
- `queryable: false`, `fulltextIndexed: false`, and `includedInSupertypeQuery: false` while CMIS query is unsupported.
- `controllablePolicy: false` and `controllableACL: false` while policy and ACL services are unsupported.
- `typeMutability.create/update/delete: false` while CMIS type management is unsupported.

Alternative considered: omit optional attributes from JSON responses. A stable explicit shape is easier for CMIS clients to consume and better reflects the CMIS requirement that optional attributes are defined even when not set.

## Risks / Trade-offs

- Client expectations for `cmis:item` creation could increase -> Mitigate by setting content record custom types `creatable: false` until CMIS content record creation is implemented.
- More complete type metadata may reveal unsupported behaviors more clearly -> Mitigate with conservative false capability flags and existing explicit `notSupported` responses.
- Query-related attributes may look redundant while query is unsupported -> Mitigate by keeping them false and covering that behavior in tests.
