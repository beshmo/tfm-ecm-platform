## Context

The content-type schema administration page lives at `/content-types` in the Management Frontend. It is implemented as a single `ContentTypeSchemasPageComponent` (1043 lines) with all template, styles, and logic in one file. The page currently serves two roles that are awkwardly combined:

1. **Folder navigation** — breadcrumb-based browsing of the `/system/schemas` folder hierarchy, with flat subfolder buttons and an inline subfolder creation form. Folder context is tracked via a `schemaFolderCrumbs` array.
2. **Schema CRUD** — a sidebar list of all active schema versions (across all folders) with inline Create and Replace forms containing a multi-field editor (name, type, required checkboxes, reorder buttons). Replace is an exact copy of Create with disabled name/version fields.

The combination makes the component hard to maintain (dual state for folder crumbs + inline forms + two parallel draft states) and limits future extensibility. The design replaces this with a three-part layout familiar from content management systems: tree explorer, content list with toolbar, and modal forms.

The existing API client (`ContentTypeApiClient`) already exposes all needed endpoints: folder tree via `getSchemaFolder`/`listSchemaSubfolders`, definitions via `listContentTypeDefinitions`, and schema CRUD via `createSchema`/`replaceSchemaVersion`/`deactivateSchemaVersion`/`moveContentTypeDefinition`. No API changes are needed.

## Goals / Non-Goals

**Goals:**
- Replace flat breadcrumb folder navigation with a recursive tree explorer rooted at `/system/schemas`
- Show schema definitions filtered by the selected folder (one row per definition — name + latest active version)
- Provide a toolbar (New, Edit, Move, Deactivate) above the schema list; buttons are enabled only when a definition is selected
- Replace the inline Create and Replace forms with a CSS overlay modal dialog that works in both create and edit modes
- Provide a folder-picker modal for the Move action and a simple name-input modal for creating schema folders
- Match the existing app visual style (no new CSS framework, no Angular Material/CDK)
- Keep all existing behavioral requirements intact — the change is UI-only

**Non-Goals:**
- No changes to backend services, API endpoints, or shared types
- No changes to the folder-explorer content-authoring page or any other feature
- No changes to the routing structure
- No introduction of state management libraries, Angular CDK, or Material Design
- No keyboard shortcut system or drag-and-drop reordering
- No changes to the YAML generation logic (`draftToYaml`, `draftFromSchema`) — these functions move into the modal component unchanged
- No changes to the field-type editor or supported field types

## Decisions

### Decision: Recursive tree component with lazy loading

The tree expands from `SYSTEM_SCHEMAS_FOLDER_ID`. Each node fetches its children on first expand via `listSchemaSubfolders()`. The component uses `forwardRef(() => SchemaFolderTreeComponent)` in its `imports` to support recursive template rendering.

**Alternatives considered:**
- Flat indented list built from an eager-loaded tree — simpler template but requires loading the entire subfolder tree upfront, which doesn't scale to deeper hierarchies
- CDK Tree — would add a new dependency and follows a different mental model than the rest of the app

### Decision: CSS overlay modal (fixed backdrop + centered panel)

Each modal uses a `position: fixed` backdrop that covers the viewport with a semi-transparent background, and a centered `position: fixed` panel. Backdrop click closes the modal. This matches Angular CDK overlay behavior without the dependency.

**Choices:**
- `<dialog>` element — native modal with built-in focus trapping and `::backdrop`, but inconsistent `close()` behavior across browsers and less control over animation
- Inline section with `*ngIf` (existing folder-explorer pattern) — simpler but doesn't provide the visual "modal" affordance the user wants
- CSS overlay chosen as the middle ground: no dependencies, consistent cross-browser, explicit backdrop and focus management

### Decision: One modal component for both create and edit

The `SchemaEditorModalComponent` has an `@Input() mode: 'create' | 'edit'`. In create mode, name and version inputs are enabled. In edit mode, name and version are pre-populated and disabled. The field editor (add/remove/reorder rows, type dropdown, required checkbox) works identically in both modes.

**Rationale:** The current page duplicates the field editor code for Create and Replace forms (two identical sections, each 50+ lines of template). A single modal component eliminates this duplication. The `draftToYaml` and `draftFromSchema` helper functions move into the modal component.

### Decision: Data loading is folder-scoped

When the user selects a folder in the tree:
1. Call `listContentTypeDefinitions(folderId)` to get all definitions in that folder
2. For each `ContentTypeDefinition`, extract the latest active version from `versions[]`
3. Display one row per definition: `name` + `latestActiveVersion`
4. Selecting a row fetches the full schema definition via `getSchemaVersion(name, version)` to populate the detail view and the edit modal

Previously, `listSchemas()` returned all active summaries globally. The redesign scopes the schema list to the selected folder, which matches the folder-first mental model. The global `listSchemas()` endpoint is still available and unchanged — the frontend simply uses `listContentTypeDefinitions()` for the folder-scoped view.

### Decision: Each new component is a standalone file with inline template/styles

The existing codebase uses inline templates in `@Component.template` and `@Component.styles`. Each new component follows this convention but lives in its own `.ts` file to keep the shell component manageable.

### Decision: Schema details shown in a detail panel below the list

When a definition is selected in the list, the right panel splits into two sections:
- Top: toolbar + schema list (the selected row is highlighted)
- Bottom: detail section showing the full normalized schema (name, version, active, fields table)

This replaces the current "Details" section that appears in the workspace. The toolbar always remains visible at the top.

## Risks / Trade-offs

- **[Risk] Recursive component pattern is uncommon in Angular** — the `forwardRef` approach works but may confuse developers unfamiliar with it. **Mitigation:** Keep the tree component focused and well-structured; the template is simple (just expand/collapse + emit selection).
- **[Risk] Modal focus trapping** — the CSS overlay modal doesn't natively trap focus. Tab-navigating past the last focusable element can escape the modal. **Mitigation:** Add a `FocusTrap` directive or a manual focus-management callback on open/close. Since the modals are simple (few focusable elements), a manual `@ViewChild` focus-on-open pattern is sufficient.
- **[Trade-off] Folder-scoped schema list hides schemas in other folders** — administrators who previously saw all schemas in one flat list now need to navigate folders to find definitions. This is intentional: the folder hierarchy is the organizational model, and the tree makes it navigable.
- **[Trade-off] Modal hides the page context** — unlike inline forms where the schema list remains visible, modals obscure the list. The trade-off is cleaner separation of editing concern vs. browsing concern, at the cost of losing context while editing. The modal title and pre-populated fields mitigate this.
