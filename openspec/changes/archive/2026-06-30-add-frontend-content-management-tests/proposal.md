## Why

Phase 3 content management now has frontend behavior for browsing folders, authoring schema-driven draft content, and managing static files, but the highest-risk Angular template and route interactions are not yet covered by component/integration tests. Adding this coverage closes the roadmap testing gap and aligns the Management Frontend with the layered testing targets in ADR-0014.

## What Changes

- Add DOM-capable Angular component/integration test support for the Management Frontend test suite.
- Extend folder explorer tests beyond class-level state checks to cover rendered author workflows, forms, events, and visible states.
- Add route-level integration coverage for `/folders` and `/folders/:folderId` using mocked frontend API clients.
- Fill focused unit-test gaps for API-client URL encoding, browser-controlled upload headers, and structured error mapping where needed.
- Keep the slice scoped to mocked frontend dependencies; this change does not add browser E2E tests or backend service integration tests.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `management-content-authoring`: Adds requirements that content management frontend behavior is covered by unit and Angular integration tests.

## Impact

- Affected app: `apps/management-frontend`
- Affected tests: Vitest setup, Angular component/integration specs, route specs, and frontend API-client specs
- Affected specs: `openspec/specs/management-content-authoring`
- Potential dependency impact: may require a DOM test environment dependency such as `jsdom` if the current workspace does not already provide one
