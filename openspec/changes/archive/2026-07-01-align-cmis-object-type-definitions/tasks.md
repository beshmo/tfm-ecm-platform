## 1. Shared CMIS Type Contracts

- [x] 1.1 Extend the shared `CmisTypeDefinition` contract with CMIS 1.1 common object-type attributes.
- [x] 1.2 Add a shared `typeMutability` shape with conservative `create`, `update`, and `delete` flags.
- [x] 1.3 Add the `cmis:item` base type definition to CMIS base type discovery.
- [x] 1.4 Set base type `parentId` values to `null` and ECMP custom content type `parentId` values to `cmis:item`.
- [x] 1.5 Keep unsupported optional base types unadvertised until ECMP supports their backing domain behavior.

## 2. CMIS Adapter Responses

- [x] 2.1 Ensure `/api/cmis/:repositoryId/types` returns `cmis:folder`, `cmis:document`, `cmis:item`, and active ECMP custom content types.
- [x] 2.2 Ensure every returned type definition includes stable common attributes and conservative unsupported-behavior flags.
- [x] 2.3 Preserve existing CMIS object mapping, content stream, folder navigation, and unsupported service behavior.

## 3. Tests

- [x] 3.1 Update shared CMIS mapping tests to expect `cmis:item` in base type definitions.
- [x] 3.2 Add shared tests that every base type definition includes the CMIS common object-type attributes.
- [x] 3.3 Add shared tests that ECMP custom content type definitions use `baseId: cmis:item` and `parentId: cmis:item`.
- [x] 3.4 Update content service CMIS controller tests to cover type discovery with `cmis:item` and common attributes.
- [x] 3.5 Add regression coverage that `cmis:relationship`, `cmis:policy`, and `cmis:secondary` are not advertised.

## 4. Documentation And Validation

- [x] 4.1 Update README and architecture documentation to describe `cmis:item` mapping for structured content records.
- [x] 4.2 Update the main `cmis-browser-binding` OpenSpec capability after implementation or during archive sync.
- [x] 4.3 Run OpenSpec validation for `align-cmis-object-type-definitions`.
- [x] 4.4 Run the relevant typecheck, lint, test, and build gates after implementation.
