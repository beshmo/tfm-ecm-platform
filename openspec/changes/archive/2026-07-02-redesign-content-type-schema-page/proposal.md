## Why

The content-type schema administration page is a single monolithic component (1043 lines) that combines folder navigation, schema listing, create forms, and replace forms in a flat layout. As the schema management surface grows, this structure makes changes risky and the UI increasingly cramped. The page needs a dedicated layout that separates concerns: tree-based folder navigation on the left, a selectable schema list with toolbar actions on the right, and modal dialogs for create/edit operations.

## What Changes

- **Tree folder explorer replaces breadcrumb navigation**: The current flat subfolder list and breadcrumb pattern is replaced with a recursive tree component rooted at `/system/schemas`. Each node lazy-loads children on expand. Selecting a folder filters the right panel to show definitions in that folder.
- **Schema list with toolbar replaces workspace section**: The current sidebar schema list and inline detail/create/replace forms are replaced by a right panel with a toolbar (New, Edit, Move, Deactivate) above a selectable list of content type definitions. Each definition row shows the name and latest active version. Selecting a definition enables the toolbar buttons.
- **Modal dialogs for create, edit, move, and create-folder**: New and Edit open a CSS overlay modal with the existing structured field editor form (name, version, field rows with type/required/reorder). Move opens a folder picker modal showing available schema folders. Create-folder opens a simple name-input modal.
- **Content-type schema page is refactored**: The monolithic component is split into a shell component that composes the tree, list, toolbar, and modal sub-components. Inline create/replace forms and folder navigation state are removed.
- **Integration tests are updated**: Tests adapt to the new tree + modal interaction model, covering folder selection, toolbar actions, modal-based create/edit, and folder picker selection.

No backend code, API endpoints, or behavioral requirements change.

## Capabilities

### New Capabilities

This change does not introduce new backend or frontend capabilities. Existing specs already cover the behavioral requirements (schema folder browsing, definition move, create/replace/deactivate from YAML). The change is a UI presentation refactor only.

### Modified Capabilities

None. All existing spec requirements remain unchanged — only the frontend implementation and UI layout change.

## Impact

- **Frontend** (`apps/management-frontend/src/app/features/content-types/presentation/`):
  - `content-type-schemas-page.component.ts` — refactored from monolithic to shell layout
  - `schema-folder-tree.component.ts` — new recursive tree component
  - `schema-editor-modal.component.ts` — new CSS overlay modal for create/edit schemas
  - `folder-picker-modal.component.ts` — new CSS overlay modal for move and create-folder actions
  - `content-type-schemas-page.component.integration.spec.ts` — updated interaction tests
- **No changes** to: routes, API client, shared types, backend services, or any other frontend feature
