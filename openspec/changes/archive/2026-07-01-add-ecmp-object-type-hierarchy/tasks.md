## 1. Shared ECMP Object-Type Contracts

- [x] 1.1 Add shared ECMP object-type identifiers for Object Type, Folder Type, Document Type, Content Type Definition, and user content type definitions.
- [x] 1.2 Add shared ECMP object-type definition and type mutability contracts with common attributes.
- [x] 1.3 Add built-in ECMP object-type definitions for Object Type, Folder Type, Document Type, and Content Type Definition.
- [x] 1.4 Add mapping helpers that derive user content type definitions from active content type schemas.
- [x] 1.5 Add tests for the ECMP hierarchy, parent relationships, common attributes, and Document terminology.

## 2. CMIS Type Projection

- [x] 2.1 Extend CMIS type definition contracts with common CMIS object-type attributes.
- [x] 2.2 Add `cmis:item` and `ecmp:content-type-definition` to CMIS type discovery.
- [x] 2.3 Map user content type schemas to `cmis:item` descendants with `parentId` equal to `ecmp:content-type-definition`.
- [x] 2.4 Keep `cmis:relationship`, `cmis:policy`, and `cmis:secondary` unadvertised.
- [x] 2.5 Map ECMP object-type common attributes to CMIS object-type attributes with conservative unsupported flags.
- [x] 2.6 Preserve existing folder, document, content stream, navigation, creation, deletion, and unsupported-service behavior.

## 3. Adapter And Contract Tests

- [x] 3.1 Update shared CMIS mapping tests to expect `cmis:item`, `ecmp:content-type-definition`, and user content type parent relationships.
- [x] 3.2 Add shared tests that every returned CMIS type definition includes common object-type attributes.
- [x] 3.3 Update Content Service CMIS controller tests for expanded type discovery and Document terminology.
- [x] 3.4 Add regression coverage that unsupported CMIS optional base types are not advertised.

## 4. Documentation And Validation

- [x] 4.1 Update `README.md` with ECMP object-type hierarchy and Document terminology.
- [x] 4.2 Update `docs/architecture.md` with the object-type model, Content Type Definition parent, and CMIS projection table.
- [x] 4.3 Run `openspec validate add-ecmp-object-type-hierarchy`.
- [x] 4.4 Run relevant package tests for shared types and CMIS adapter behavior.
- [x] 4.5 Run repository typecheck/lint/test/build gates as appropriate for the implementation scope.
