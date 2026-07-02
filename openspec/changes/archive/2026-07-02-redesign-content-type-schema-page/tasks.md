## 1. Schema Folder Tree Component

- [x] 1.1 Create `schema-folder-tree.component.ts` with standalone flag, `CommonModule` imports, and `forwardRef(() => SchemaFolderTreeComponent)` in imports for recursive rendering
- [x] 1.2 Implement tree node template: expand/collapse arrow (▶/▼), folder name, selected highlight via `[class.selected]`, recursive `<ecmp-schema-folder-tree>` for children
- [x] 1.3 Add `@Input() folders: Folder[]`, `@Input() selectedFolderId: FolderId | null`, and `@Output() selectFolder = new EventEmitter<Folder>()` to the tree node
- [x] 1.4 Implement lazy loading: on first expand, call `ContentTypeApiClient.listSchemaSubfolders()` to fetch children, store expanded state per node
- [x] 1.5 Integrate tree into the page shell: load root folder from `SYSTEM_SCHEMAS_FOLDER_ID`, seed initial tree, connect selectFolder to load definitions

## 2. Schema Editor Modal Component

- [x] 2.1 Create `schema-editor-modal.component.ts` with standalone flag, `CommonModule` + `FormsModule` imports
- [x] 2.2 Build CSS overlay modal template: fixed backdrop (click to close), centered white panel with header (title + close button), form body, footer (Save + Cancel buttons)
- [x] 2.3 Add `@Input() mode: 'create' | 'edit'`, `@Input() schema: ContentTypeSchemaDefinition | null`, `@Output() saved = new EventEmitter<ContentTypeSchemaDefinition>()`, `@Output() closed = new EventEmitter<void>()`
- [x] 2.4 Implement schema draft state: create a `SchemaDraft` from schema input (edit mode) or a default empty draft (create mode)
- [x] 2.5 Build field editor template: dynamic list of field rows with name input, type dropdown (`FIELD_TYPES`), required checkbox, up/down/remove buttons, plus Add field button
- [x] 2.6 Move helper functions `draftToYaml`, `draftFromSchema`, `emptyFieldDraft`, `defaultCreateDraft`, `moveField` from the page component into the modal component
- [x] 2.7 Implement Save: serialize draft to YAML, emit `saved` event with the YAML string; implement Cancel/close: emit `closed` event

## 3. Folder Picker Modal Component

- [x] 3.1 Create `folder-picker-modal.component.ts` with standalone flag, `CommonModule` imports
- [x] 3.2 Build CSS overlay modal template: fixed backdrop, centered panel listing available folders as clickable items
- [x] 3.3 Add `@Input() folders: Folder[]`, `@Input() title: string`, `@Output() selected = new EventEmitter<FolderId>()`, `@Output() closed = new EventEmitter<void>()`
- [x] 3.4 Add `@Input() mode: 'move' | 'create-folder'` — move mode shows folder list to pick; create-folder mode shows a name input field
- [x] 3.5 Implement selection: clicking a folder emits its ID; create-folder form emits the parent folder ID and new name
- [x] 3.6 Reuse the same component for Move and Create Folder toolbar actions (different `@Input()` configs)

## 4. Refactor Content Type Schemas Page

- [x] 4.1 Remove `schema-folders` section, breadcrumb navigation, subfolder list, create-folder form, definition list with move dropdowns from the template
- [x] 4.2 Remove inline Create form and inline Replace form from the template
- [x] 4.3 Remove old `aside` + `article` workspace layout; replace with new two-column grid (tree | toolbar + list + detail)
- [x] 4.4 Remove component class fields: `schemaFolderCrumbs`, `schemaSubfolders`, `definitions`, `moveCandidateFolders`, `createDraft`, `replaceDraft`, `newSchemaFolderName`, `moveTargetFolderId`, `moveErrorMessage`, `createFolderErrorMessage`, `folderLoading`, `folderSaving`
- [x] 4.5 Remove component class methods: `loadSchemaFolderContext`, `enterSchemaFolder`, `goToSchemaCrumb`, `createSchemaFolder`, `moveDefinition`, `recomputeMoveCandidates`, `createSchema`, `replaceSchema`, `confirmDeactivate`, `addCreateField`, `removeCreateField`, `moveCreateField`, `addReplaceField`, `removeReplaceField`, `moveReplaceField`, `refreshAfterWrite`, `findSummary`, all error helpers, all clear-error helpers
- [x] 4.6 Add new fields for folder/tree state: `treeRoot: TreeNode`, `selectedFolderId: FolderId`, `definitions: ContentTypeDefinition[]`, `selectedDefinition: ContentTypeDefinition | null`, `selectedSchema: ContentTypeSchemaDefinition | null`
- [x] 4.7 Add new fields for modal state: `editorMode: 'create' | 'edit'`, `editorOpen: boolean`, `pickerMode: 'move' | 'create-folder'`, `pickerOpen: boolean`, `pickerFolders: Folder[]`
- [x] 4.8 Add fields for toolbar: `definitionList: ContentTypeDefinition[]`, schema detail display state
- [x] 4.9 Implement `loadFolderDefinitions(folderId)` — calls `listContentTypeDefinitions()`, updates `definitionList`
- [x] 4.10 Implement `selectDefinition(def)` — fetches latest active schema version via `getSchemaVersion()`, populates detail view
- [x] 4.11 Wire tree `selectFolder` event to `loadFolderDefinitions`
- [x] 4.12 Wire toolbar buttons: New opens editor modal in create mode; Edit opens editor modal in edit mode; Move opens folder picker; Deactivate calls confirm + API
- [x] 4.13 Wire editor modal: on `saved` call appropriate API (`createSchema` or `replaceSchemaVersion`), refresh definitions, close modal; on `closed` close modal
- [x] 4.14 Wire folder picker: on selected folder, call `moveContentTypeDefinition` or `createSchemaFolder`, refresh tree + definitions, close modal
- [x] 4.15 Build new detail section below the schema list: shows name, version, active status, fields table when a definition is selected
- [x] 4.16 Add inline styles matching the existing color scheme (`#f5f7f9`, `#1c5d99`, `#5d6773`, etc.)

## 5. Update Integration Tests

- [x] 5.1 Remove tests that exercise old folder navigation (breadcrumb clicks, subfolder creation, inline definition move, inline move dropdown interaction)
- [x] 5.2 Remove tests that exercise inline create/replace form interaction (field name/type inputs, reorder buttons, form submission)
- [x] 5.3 Add test data setup for folder tree: mock `getSchemaFolder` and `listSchemaSubfolders` for tree root
- [x] 5.4 Add test for tree rendering: verify root folder is displayed, clicking a folder loads definitions
- [x] 5.5 Add test for schema list: verify definitions are displayed for the selected folder
- [x] 5.6 Add test for toolbar: verify New/Edit/Move/Deactivate buttons are present; verify buttons are disabled when no definition is selected
- [x] 5.7 Add test for editor modal open/close: click New → modal appears → click Cancel → modal closes
- [x] 5.8 Add test for modal create schema: fill fields in modal, click Save → verify API call → verify refresh
- [x] 5.9 Add test for modal edit schema: select definition, click Edit → modal opens with pre-populated fields → modify → Save → verify API call
- [x] 5.10 Add test for folder picker move: select definition, click Move → picker opens → select target → verify API call
- [x] 5.11 Add test for deactivate: select definition, click Deactivate → confirm → verify API call → refresh
- [x] 5.12 Update helper functions (`input`, `button`, `pageText`) to work with new DOM structure (modals, no inline forms)
- [x] 5.13 Remove helper functions that are no longer needed (`formElement`, `clickFormButton`, `clickFieldRowButton`, `setSelectValue`, `selectValue`, `clickAriaButton` for old nav)

## 6. Verify

- [x] 6.1 Run `pnpm --filter @ecmp/management-frontend typecheck` to verify no type errors
- [x] 6.2 Run `pnpm --filter @ecmp/management-frontend test -- src/app/features/content-types/presentation/content-type-schemas-page.component.integration.spec.ts` to verify tests pass
- [x] 6.3 Run `pnpm --filter @ecmp/management-frontend lint` to verify lint passes
