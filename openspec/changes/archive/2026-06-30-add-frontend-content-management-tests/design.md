## Context

The Management Frontend currently uses Angular standalone components, Angular Forms, Angular Router, Angular HTTP Client, and Vitest. Existing Phase 3 frontend tests cover API-client URL mapping and folder explorer behavior by instantiating `FolderExplorerPageComponent` as a class with mocked clients. That verifies component state transitions, but it does not exercise Angular template binding, rendered forms, DOM events, route parameter input binding, or visible loading/error/empty states.

ADR-0014 sets a minimum target for Angular component/integration tests, and the Phase 3 roadmap explicitly calls out frontend unit and integration tests for content management. This change adds that focused coverage without broadening into browser E2E or backend integration testing.

## Goals / Non-Goals

**Goals:**

- Add Angular component/integration tests for content management workflows in the folder explorer.
- Verify rendered DOM behavior for folder selection, content create/edit/delete, static file upload/rename/delete, validation, and visible error states.
- Verify route-level integration for `/folders` and `/folders/:folderId` using Angular Router and mocked frontend API clients.
- Preserve API-client unit coverage and add missing cases for encoded IDs, FormData behavior, and representative error mapping.
- Keep tests deterministic, fast, and isolated from backend services.

**Non-Goals:**

- Do not add Playwright E2E coverage in this change.
- Do not run real API Gateway, Content Service, or Content Type Service instances from frontend tests.
- Do not redesign the folder explorer UI or split the component into new feature components unless required to make tests reliable.
- Do not introduce NgModules; tests should align with standalone Angular feature areas.

## Decisions

### Use Vitest with an Angular-capable DOM test environment

The frontend test suite will continue to run through Vitest, but component integration specs need a DOM environment such as `jsdom` and Angular testing setup. This is a small extension of the existing toolchain instead of adding a separate test runner.

Alternative considered: keep all tests as class-only unit tests. That misses the risk this change is meant to cover: template binding, form controls, event wiring, and route integration.

Alternative considered: add Playwright for these scenarios. That would exercise the browser more fully, but it is heavier and belongs to the roadmap's E2E layer rather than this component/integration testing slice.

### Mock frontend API clients at the Angular provider boundary

Component and route integration tests will provide mocked `FolderApiClient`, `ContentApiClient`, `ContentTypeApiClient`, and `StaticFileApiClient` instances. This keeps tests focused on frontend behavior while still verifying the component's integration with the same provider contracts used at runtime.

Alternative considered: use Angular HTTP testing utilities in component tests. That would duplicate the API-client tests and make component tests more brittle to request details already covered by client specs.

### Keep API-client tests as unit tests

API-client specs will remain direct unit tests against mocked `HttpClient` observables. Missing coverage should be added there for encoded IDs, upload FormData shape, omitted manual `content-type`, and structured error mapping.

Alternative considered: rewrite API-client tests using `HttpClientTestingBackend`. That would be more Angular-native but would require more setup without materially improving confidence for the current thin wrappers.

## Risks / Trade-offs

- DOM environment setup can make the frontend test suite slower or more sensitive to Angular internals -> keep integration tests focused on critical workflows and leave pure API-client tests as unit tests.
- Template tests can become brittle if they assert incidental markup -> query by accessible text, roles, labels, and visible workflow outcomes where practical.
- File input behavior varies between DOM shims -> isolate upload tests around the component's public rendered input/change behavior and the mocked static file client call.
- Route integration can accidentally become a full app test -> use the real route config but mocked API clients, and limit assertions to route rendering and `folderId` binding.
