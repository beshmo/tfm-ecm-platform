## 1. Test Runtime Setup

- [x] 1.1 Add or configure a DOM-capable Vitest environment for Angular component integration tests in the Management Frontend.
- [x] 1.2 Update the frontend test setup to initialize Angular testing support required by standalone component and router integration specs.
- [x] 1.3 Verify existing frontend API-client and class-level component tests still run under the updated test setup.

## 2. API Client Unit Coverage

- [x] 2.1 Extend content API client tests to cover encoded folder/content identifiers and representative validation, not-found, and conflict error mapping.
- [x] 2.2 Extend static file API client tests to cover encoded folder/file identifiers, upload FormData contents, absence of manual `content-type`, and representative upload/delete error mapping.
- [x] 2.3 Extend content type API client tests to cover encoded content type and schema version identifiers and representative schema request error mapping.

## 3. Folder Explorer Component Integration Coverage

- [x] 3.1 Add Angular component integration tests that render folders, content records, static files, selected folder path, empty state, loading state, and page-level request errors.
- [x] 3.2 Add rendered folder selection tests that click folder controls and verify content/file reload behavior for the selected folder.
- [x] 3.3 Add rendered content creation tests for schema selection, schema-rendered controls, required field validation, integer conversion, successful submit, refresh, and backend validation errors that preserve form data.
- [x] 3.4 Add rendered content edit/delete tests for stored schema version loading, replace submit, delete confirmation, cancel behavior, not-found refresh, and conflict visibility.
- [x] 3.5 Add rendered static file tests for file input selection, missing-file validation, upload success and failure, rename success and cancel behavior, delete success, delete cancel behavior, and not-found refresh.

## 4. Route Integration Coverage

- [x] 4.1 Add Angular Router integration tests that navigate to `/folders` and verify the folder explorer renders with `FLD-root`.
- [x] 4.2 Add Angular Router integration tests that navigate to `/folders/:folderId` and verify the route parameter drives selected folder content and file requests.

## 5. Verification

- [x] 5.1 Run `pnpm --filter @ecmp/management-frontend test` and fix any frontend test failures.
- [x] 5.2 Run `pnpm test:frontend` from the repository root.
- [x] 5.3 Run `pnpm lint` from the repository root.
- [x] 5.4 Run `openspec validate add-frontend-content-management-tests`.
