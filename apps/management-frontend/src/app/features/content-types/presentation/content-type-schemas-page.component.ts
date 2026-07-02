import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  ContentTypeDefinition,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  Folder,
  FolderId
} from "@ecmp/shared-types";
import { SYSTEM_SCHEMAS_FOLDER_ID } from "@ecmp/shared-types";

import type { ApiClientError } from "../../../shared/infrastructure/api-client-error";
import { ContentTypeApiClient } from "../infrastructure/content-type-api.client";
import { SchemaFolderTreeComponent } from "./schema-folder-tree.component";
import { SchemaEditorModalComponent } from "./schema-editor-modal.component";
import { FolderPickerModalComponent } from "./folder-picker-modal.component";

@Component({
  selector: "ecmp-content-type-schemas-page",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SchemaFolderTreeComponent,
    SchemaEditorModalComponent,
    FolderPickerModalComponent
  ],
  template: `
    <main class="shell">
      <header class="toolbar">
        <div>
          <h1>Content Type Schemas</h1>
          <p *ngIf="definitionList.length > 0">{{ definitionList.length }} definitions</p>
        </div>
        <button type="button" class="secondary" (click)="loadRootContext()" [disabled]="loading">
          Refresh
        </button>
      </header>

      <div class="layout">
        <div class="tree-panel">
          <div class="tree-header">
            <h2>Folders</h2>
            <button type="button" class="secondary" (click)="onNewFolder()" title="New folder">
              +
            </button>
          </div>
          <ecmp-schema-folder-tree
            *ngIf="rootFolder"
            [folders]="[rootFolder]"
            [selectedFolderId]="selectedFolderId"
            (selectFolder)="onSelectFolder($event)"
          />
          <p *ngIf="!rootFolder && !loading" class="empty">Loading folders...</p>
        </div>

        <div class="content-panel">
          <div class="content-toolbar">
            <span class="folder-label">{{ currentFolderLabel }}</span>
            <div class="actions">
              <button
                type="button"
                (click)="onNew()"
                [disabled]="!selectedFolderId"
              >
                New
              </button>
              <button
                type="button"
                (click)="onEdit()"
                [disabled]="!selectedDefinition || !selectedSchema"
              >
                Edit
              </button>
              <button
                type="button"
                (click)="onMove()"
                [disabled]="!selectedDefinition"
              >
                Move
              </button>
              <button
                type="button"
                class="danger"
                (click)="onDeactivate()"
                [disabled]="!selectedDefinition"
              >
                Deactivate
              </button>
            </div>
          </div>

          <p *ngIf="loading" class="empty">Loading definitions...</p>
          <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>

          <div class="schema-list" *ngIf="!loading">
            <p *ngIf="definitionList.length === 0" class="empty">No definitions in this folder.</p>
            <button
              *ngFor="let definition of definitionList; trackBy: trackDefinitionById"
              type="button"
              class="schema-button"
              [class.active]="selectedDefinition?.contentTypeDefinitionId === definition.contentTypeDefinitionId"
              (click)="selectDefinition(definition)"
            >
              <strong>{{ definition.name }}</strong>
              <span>{{ latestActiveVersion(definition) }}</span>
            </button>
          </div>

          <div *ngIf="selectedSchema" class="detail-panel">
            <h3>Details</h3>
            <div class="details-grid">
              <span>Name</span>
              <strong>{{ selectedSchema.name }}</strong>
              <span>Version</span>
              <strong>{{ selectedSchema.version }}</strong>
              <span>Active</span>
              <strong>{{ activeVersionLabel }}</strong>
            </div>

            <table *ngIf="selectedSchema.fields.length > 0">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let field of selectedSchema.fields; trackBy: trackFieldByIndex">
                  <td>{{ field.name }}</td>
                  <td>{{ field.type }}</td>
                  <td>{{ field.required ? "Yes" : "No" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ecmp-schema-editor-modal
        *ngIf="editorOpen"
        [mode]="editorMode"
        [schema]="editSchema"
        (saved)="onEditorSaved($event)"
        (closed)="onEditorClosed()"
      />

      <ecmp-folder-picker-modal
        *ngIf="pickerOpen"
        [mode]="pickerMode"
        [folders]="pickerFolders"
        [title]="pickerTitle"
        (selected)="onPickerSelected($event)"
        (folderCreated)="onPickerFolderCreated($event)"
        (closed)="onPickerClosed()"
      />
    </main>
  `,
  styles: [
    `
      .shell {
        background: #f5f7f9;
        color: #18212b;
        min-height: 100vh;
      }

      .toolbar {
        align-items: center;
        background: #ffffff;
        border-bottom: 1px solid #d7dde3;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        padding: 1rem 1.5rem;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .toolbar p {
        color: #52606d;
        margin-top: 0.25rem;
      }

      button {
        background: #1c5d99;
        border: 0;
        color: #ffffff;
        cursor: pointer;
        padding: 0.5rem 0.75rem;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      button.secondary {
        background: #5d6773;
      }

      button.danger {
        background: #a33131;
      }

      .layout {
        display: grid;
        gap: 0;
        grid-template-columns: minmax(14rem, 20rem) 1fr;
        padding: 1rem;
      }

      .tree-panel {
        background: #ffffff;
        border: 1px solid #d7dde3;
        min-width: 0;
        padding: 0.75rem;
      }

      .tree-header {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #d7dde3;
      }

      .tree-header h2 {
        font-size: 1rem;
      }

      .tree-header button {
        font-size: 1rem;
        line-height: 1;
        padding: 0.25rem 0.5rem;
      }

      .content-panel {
        background: #ffffff;
        border: 1px solid #d7dde3;
        border-left: 0;
        min-width: 0;
        padding: 1rem;
      }

      .content-toolbar {
        align-items: center;
        display: flex;
        gap: 0.75rem;
        justify-content: space-between;
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #d7dde3;
      }

      .folder-label {
        color: #52606d;
        font-weight: 600;
      }

      .actions {
        display: flex;
        gap: 0.375rem;
      }

      .schema-list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .schema-button {
        align-items: start;
        background: transparent;
        color: #18212b;
        display: grid;
        gap: 0.125rem;
        overflow-wrap: anywhere;
        text-align: left;
        width: 100%;
      }

      .schema-button span {
        color: #52606d;
        font-size: 0.875rem;
      }

      .schema-button.active {
        background: #e8f1f8;
        color: #124b7c;
      }

      .detail-panel {
        border-top: 1px solid #d7dde3;
        margin-top: 1rem;
        padding-top: 1rem;
      }

      .detail-panel h3 {
        font-size: 1rem;
        margin-bottom: 0.75rem;
      }

      .details-grid {
        display: grid;
        gap: 0.5rem 1rem;
        grid-template-columns: max-content 1fr;
      }

      .details-grid span {
        color: #52606d;
      }

      table {
        border-collapse: collapse;
        margin-top: 0.75rem;
        width: 100%;
      }

      th,
      td {
        border-bottom: 1px solid #d7dde3;
        padding: 0.5rem;
        text-align: left;
        vertical-align: top;
      }

      .empty {
        color: #52606d;
        padding: 0.5rem 0;
      }

      .error {
        color: #a33131;
        overflow-wrap: anywhere;
      }

      @media (max-width: 860px) {
        .layout {
          display: block;
        }
        .content-panel {
          border-left: 1px solid #d7dde3;
          border-top: 0;
        }
      }
    `
  ]
})
export class ContentTypeSchemasPageComponent implements OnInit {
  rootFolder: Folder | null = null;
  selectedFolderId: FolderId = SYSTEM_SCHEMAS_FOLDER_ID;
  selectedFolderName = "Schemas";
  definitionList: ContentTypeDefinition[] = [];
  selectedDefinition: ContentTypeDefinition | null = null;
  selectedSchema: ContentTypeSchemaDefinition | null = null;
  loading = false;
  errorMessage = "";

  editorOpen = false;
  editorMode: "create" | "edit" = "create";
  editSchema: ContentTypeSchemaDefinition | null = null;

  pickerOpen = false;
  pickerMode: "move" | "create-folder" = "move";
  pickerFolders: Folder[] = [];
  pickerTitle = "";

  @ViewChild(SchemaFolderTreeComponent)
  private treeComponent!: SchemaFolderTreeComponent;

  constructor(
    @Inject(ContentTypeApiClient)
    private readonly contentTypeApi: ContentTypeApiClient
  ) {}

  ngOnInit(): void {
    void this.loadRootContext();
  }

  get currentFolderLabel(): string {
    return this.selectedFolderName;
  }

  get activeVersionLabel(): string {
    if (!this.selectedDefinition || !this.selectedSchema) {
      return "";
    }
    const version = this.selectedDefinition.versions.find((v) => v.active);
    return version ? "Yes" : "No";
  }

  latestActiveVersion(definition: ContentTypeDefinition): string {
    const active = definition.versions.find((v) => v.active);
    return active ? active.version : "inactive";
  }

  async loadRootContext(): Promise<void> {
    this.loading = true;
    this.errorMessage = "";

    try {
      const root = await this.contentTypeApi.getSchemaFolder(SYSTEM_SCHEMAS_FOLDER_ID);
      this.rootFolder = root;
      this.selectedFolderId = root.folderId;
      this.selectedFolderName = root.name;
      await this.loadFolderDefinitions(root.folderId);
    } catch (error) {
      this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
    } finally {
      this.loading = false;
    }
  }

  async loadFolderDefinitions(folderId: FolderId): Promise<void> {
    this.loading = true;
    this.errorMessage = "";

    try {
      const definitions = await this.contentTypeApi.listContentTypeDefinitions(folderId);
      this.definitionList = definitions;
    } catch (error) {
      this.definitionList = [];
      this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
    } finally {
      this.loading = false;
    }
  }

  onSelectFolder(folder: Folder): void {
    this.selectedFolderId = folder.folderId;
    this.selectedFolderName = folder.name;
    this.selectedDefinition = null;
    this.selectedSchema = null;
    void this.loadFolderDefinitions(folder.folderId);
  }

  async selectDefinition(definition: ContentTypeDefinition): Promise<void> {
    this.selectedDefinition = definition;
    this.selectedSchema = null;

    const active = definition.versions.find((v) => v.active);
    if (!active) {
      return;
    }

    try {
      this.selectedSchema = await this.contentTypeApi.getSchemaVersion(
        definition.name,
        active.version
      );
    } catch (error) {
      this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
    }
  }

  onNew(): void {
    this.editorMode = "create";
    this.editSchema = null;
    this.editorOpen = true;
  }

  onEdit(): void {
    if (!this.selectedSchema) {
      return;
    }
    this.editorMode = "edit";
    this.editSchema = this.selectedSchema;
    this.editorOpen = true;
  }

  async onMove(): Promise<void> {
    if (!this.selectedDefinition) {
      return;
    }
    this.pickerMode = "move";
    this.pickerTitle = "Move to folder";
    this.pickerFolders = [];

    try {
      const subfolders = await this.contentTypeApi.listSchemaSubfolders(SYSTEM_SCHEMAS_FOLDER_ID);
      this.pickerFolders = subfolders;
    } catch {
      this.pickerFolders = [];
    }
    this.pickerOpen = true;
  }

  onNewFolder(): void {
    this.pickerMode = "create-folder";
    this.pickerTitle = "Create folder";
    this.pickerOpen = true;
  }

  async onEditorSaved(yaml: string): Promise<void> {
    if (this.editorMode === "create") {
      try {
        await this.contentTypeApi.createSchema(yaml, this.selectedFolderId);
        this.editorOpen = false;
        await this.loadFolderDefinitions(this.selectedFolderId);
      } catch (error) {
        // Error handling would be improved in a future iteration
        this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
      }
    } else if (this.editorMode === "edit" && this.selectedSchema) {
      try {
        const replaced = await this.contentTypeApi.replaceSchemaVersion(
          this.selectedSchema.name,
          this.selectedSchema.version,
          yaml
        );
        this.editorOpen = false;
        this.selectedSchema = replaced;
        await this.loadFolderDefinitions(this.selectedFolderId);
      } catch (error) {
        this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
      }
    }
  }

  onEditorClosed(): void {
    this.editorOpen = false;
  }

  async onPickerSelected(folderId: FolderId): Promise<void> {
    if (!this.selectedDefinition) {
      return;
    }
    try {
      await this.contentTypeApi.moveContentTypeDefinition(this.selectedDefinition.name, folderId);
      this.pickerOpen = false;
      this.selectedDefinition = null;
      this.selectedSchema = null;
      await this.loadFolderDefinitions(this.selectedFolderId);
      if (this.treeComponent) {
        this.treeComponent.reloadFolder(this.selectedFolderId);
      }
    } catch (error) {
      this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
    }
  }

  async onPickerFolderCreated(name: string): Promise<void> {
    try {
      await this.contentTypeApi.createSchemaFolder(name, this.selectedFolderId);
      this.pickerOpen = false;
      if (this.treeComponent) {
        this.treeComponent.reloadFolder(this.selectedFolderId);
      }
    } catch (error) {
      this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
    }
  }

  onPickerClosed(): void {
    this.pickerOpen = false;
  }

  async onDeactivate(): Promise<void> {
    if (!this.selectedDefinition || !this.selectedSchema) {
      return;
    }

    const confirmed =
      typeof globalThis.confirm === "function"
        ? globalThis.confirm(
            `Deactivate ${this.selectedSchema.name} ${this.selectedSchema.version}?`
          )
        : true;

    if (!confirmed) {
      return;
    }

    try {
      await this.contentTypeApi.deactivateSchemaVersion(
        this.selectedSchema.name,
        this.selectedSchema.version
      );
      this.selectedDefinition = null;
      this.selectedSchema = null;
      await this.loadFolderDefinitions(this.selectedFolderId);
    } catch (error) {
      this.errorMessage = (error as Partial<ApiClientError>).message ?? "Request failed.";
    }
  }

  trackDefinitionById(_index: number, definition: ContentTypeDefinition): string {
    return definition.contentTypeDefinitionId;
  }

  trackFieldByIndex(index: number): number {
    return index;
  }
}
