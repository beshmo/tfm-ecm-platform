## Context

Content type schemas are normalized through `packages/shared-yaml`, shared through `packages/shared-types`, validated by the Content Service domain, authored through Angular schema forms, and projected to CMIS through shared mapping helpers. The current type set is intentionally small: `string`, `integer`, `date`, and `time`.

This change extends that same pipeline with `boolean`, `datetime`, `decimal`, `html`, and `uri`. The field types must remain JSON-compatible because content instance `data` is stored and transported as plain JSON objects.

## Goals / Non-Goals

**Goals:**

- Extend the shared `ContentFieldType` contract and YAML parser allowlist.
- Validate the new field values without backend string-to-type coercion.
- Keep frontend generated forms compatible with backend validation.
- Preserve existing schema field ordering and lifecycle behavior.
- Map the new field types through CMIS type discovery and content object properties.
- Make HTML security expectations explicit before the type is rendered in an authoring or delivery surface.

**Non-Goals:**

- Introduce rich text editing, WYSIWYG tooling, or HTML sanitization dependencies in this change.
- Add per-field validation options such as min/max, precision, allowed URL schemes, or HTML tag allowlists.
- Add MongoDB persistence, migrations, or delivery transformations.
- Change existing `date` or `time` semantics.

## Decisions

1. Use canonical JSON values per field type.

   - `boolean` values are JSON booleans.
   - `datetime`, `html`, and `uri` values are JSON strings.
   - `decimal` values are finite JSON numbers.
   - Alternative considered: store all new types as strings. That would simplify form handling but weaken domain validation and make numeric sorting/comparison harder later.

2. Require explicit timezone information for `datetime`.

   `datetime` accepts an ISO/RFC 3339-style timestamp with either `Z` or an explicit numeric offset, such as `2026-07-01T12:30:00Z` or `2026-07-01T14:30:00+02:00`. Timestamps without timezone information are invalid.

   Alternative considered: accept browser `datetime-local` values. That loses timezone intent at the data boundary and conflicts with the requested timezone-aware type.

3. Treat `decimal` as a finite JavaScript number.

   `decimal` accepts finite numbers including integers and fractional values. `integer` remains stricter and still requires `Number.isInteger(value)`.

   Alternative considered: represent decimals as strings to avoid floating-point precision limits. That would be better for money-like exact decimals, but this schema type is only a general decimal field. Exact precision rules can be added later with field constraints if needed.

4. Treat `html` as HTML-formatted text, not trusted rendered markup.

   The backend validates `html` as a string and does not parse or execute markup. Frontend authoring can initially use a multiline text control. Any surface that renders `html` as markup must use a controlled sanitization path before insertion into the DOM.

   Alternative considered: sanitize on write. That requires choosing an HTML policy and dependency now, and can destroy author intent before the platform has final rendering rules.

5. Validate `uri` as an absolute URL/URI string.

   Initial validation should require a syntactically valid absolute URI. If implementation uses the platform URL parser, it should define the accepted schemes explicitly in tests. Management authoring should use URL-oriented controls when practical, but backend validation remains authoritative.

   Alternative considered: accept any string and leave URI handling to consumers. That would make the field type too weak to distinguish from `string`.

6. Use conservative CMIS property mappings.

   CMIS already supports `boolean`, `datetime`, and numeric property types. ECMP should map `boolean` to CMIS `boolean`, `datetime` to CMIS `datetime`, and numeric `decimal` to a CMIS numeric type supported by the shared contract. `html` and `uri` should map to CMIS `string` because CMIS has no HTML or URI primitive in the current shared type model.

## Risks / Trade-offs

- HTML fields create an XSS risk if later rendered with direct DOM insertion -> keep this change limited to storage/editing and require a sanitizer before any markup rendering.
- JavaScript numbers are not exact arbitrary-precision decimals -> document `decimal` as finite numeric content, not a money/precision type.
- Browser date/time controls do not preserve timezone offsets consistently -> use backend validation as the source of truth and avoid relying solely on `datetime-local`.
- URL parsing behavior can vary for non-HTTP schemes -> cover accepted and rejected URI examples in tests.

## Migration Plan

No data migration is required. Existing schemas and content records remain valid. Rollback consists of reverting the shared field type allowlist and rejecting schemas that use the newly added types; content records already created with those schema versions would then require those schema versions to remain available or be cleaned manually in non-production data.

## Open Questions

- Should `uri` initially allow all absolute URI schemes, or only `http:` and `https:`?
- Should `decimal` later grow precision/scale constraints for money-like use cases?
- Which sanitizer policy should delivery or preview rendering use when `html` is displayed as markup?
