import { CommonModule } from "@angular/common";
import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  ContentFieldType,
  ContentRecord,
  ContentTypeFieldDefinition,
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  Folder,
  FolderId,
  StaticFile
} from "@ecmp/shared-types";
import { ROOT_FOLDER_ID } from "@ecmp/shared-types";

import { ContentTypeApiClient } from "../../content-types/infrastructure/content-type-api.client";
import { ContentApiClient } from "../../content/infrastructure/content-api.client";
import { StaticFileApiClient } from "../../content/infrastructure/static-file-api.client";
import { FolderApiClient } from "../../folders/infrastructure/folder-api.client";
import type { ApiClientError } from "../../../shared/infrastructure/api-client-error";

interface SchemaFieldView {
  name: string;
  definition: ContentTypeFieldDefinition;
}

type EditorMode = "create" | "edit";

@Component({
  selector: "ecmp-folder-explorer-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="shell">
      <header class="toolbar">
        <div>
          <h1>Folder Explorer</h1>
          <p>{{ selectedFolder?.path ?? "/" }}</p>
        </div>
        <nav aria-label="Folder explorer actions">
          <button type="button" (click)="openCreate()" [disabled]="loading">New content</button>
          <input type="file" name="staticFile" (change)="selectUploadFile($event)" />
          <button type="button" class="secondary" (click)="uploadSelectedFile()" [disabled]="saving">
            Upload file
          </button>
        </nav>
      </header>

      <section class="workspace" aria-label="Folder explorer workspace">
        <aside aria-label="Folders">
          <h2>Folders</h2>
          <p *ngIf="loading && folders.length === 0">Loading folders...</p>
          <button
            *ngFor="let folder of folders"
            type="button"
            class="folder-button"
            [class.active]="folder.folderId === selectedFolderId"
            (click)="selectFolder(folder.folderId)"
          >
            {{ folder.path }}
          </button>
        </aside>

        <article>
          <div class="content-header">
            <h2>Content</h2>
            <span>{{ contents.length }} records</span>
          </div>

          <p *ngIf="loading">Loading content...</p>
          <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
          <p *ngIf="!loading && !errorMessage && contents.length === 0 && files.length === 0" class="empty">
            This folder has no content records or static files.
          </p>

          <table *ngIf="contents.length > 0">
            <thead>
              <tr>
                <th>Content ID</th>
                <th>Type</th>
                <th>Version</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let content of contents">
                <td>{{ content.contentId }}</td>
                <td>{{ content.contentType }}</td>
                <td>{{ content.version }}</td>
                <td>{{ content.status }}</td>
                <td>{{ content.updatedAt }}</td>
                <td>
                  <button type="button" (click)="openEdit(content)">Edit</button>
                  <button type="button" class="secondary" (click)="confirmDelete(content)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="content-header files-header">
            <h2>Files</h2>
            <span>{{ files.length }} files</span>
          </div>

          <p *ngIf="fileErrorMessage" class="error">{{ fileErrorMessage }}</p>

          <table *ngIf="files.length > 0">
            <thead>
              <tr>
                <th>File ID</th>
                <th>Name</th>
                <th>MIME type</th>
                <th>Size</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let file of files">
                <td>{{ file.fileId }}</td>
                <td>{{ file.filename }}</td>
                <td>{{ file.mimeType }}</td>
                <td>{{ file.size }}</td>
                <td>{{ file.updatedAt }}</td>
                <td>
                  <button type="button" (click)="renameFile(file)">Rename</button>
                  <button type="button" class="secondary" (click)="confirmDeleteFile(file)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </article>
      </section>

      <section *ngIf="editorOpen" class="editor" aria-label="Content editor">
        <header>
          <h2>{{ editorMode === "create" ? "New content" : "Edit content" }}</h2>
          <button type="button" class="secondary" (click)="closeEditor()">Close</button>
        </header>

        <label *ngIf="editorMode === 'create'">
          Content type
          <select
            [ngModel]="selectedContentTypeName"
            (ngModelChange)="chooseContentType($event)"
            name="contentType"
          >
            <option value="" disabled>Choose a content type</option>
            <option *ngFor="let schema of schemas; trackBy: trackSchemaSummary" [value]="schema.name">
              {{ schema.name }} {{ schema.version }}
            </option>
          </select>
        </label>

        <form *ngIf="currentSchema" (ngSubmit)="submitEditor()">
          <label *ngFor="let field of schemaFields; trackBy: trackSchemaField">
            {{ field.name }}
            <input
              [type]="inputType(field.definition.type)"
              [(ngModel)]="formData[field.name]"
              [required]="field.definition.required"
              [name]="field.name"
            />
          </label>

          <p *ngIf="formErrorMessage" class="error">{{ formErrorMessage }}</p>
          <ul *ngIf="validationMessages.length > 0" class="error-list">
            <li *ngFor="let message of validationMessages">{{ message }}</li>
          </ul>

          <button type="submit" [disabled]="saving">Save</button>
        </form>
      </section>
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
      p {
        margin: 0;
      }

      .toolbar p {
        color: #52606d;
        margin-top: 0.25rem;
      }

      nav,
      .content-header,
      .editor header {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
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

      .workspace {
        display: grid;
        gap: 1rem;
        grid-template-columns: minmax(13rem, 19rem) 1fr;
        padding: 1rem;
      }

      aside,
      article,
      .editor {
        background: #ffffff;
        border: 1px solid #d7dde3;
        padding: 1rem;
      }

      .folder-button {
        background: transparent;
        color: #18212b;
        display: block;
        overflow-wrap: anywhere;
        text-align: left;
        width: 100%;
      }

      .folder-button.active {
        background: #e8f1f8;
        color: #124b7c;
      }

      table {
        border-collapse: collapse;
        margin-top: 1rem;
        width: 100%;
      }

      .files-header {
        margin-top: 1.5rem;
      }

      th,
      td {
        border-bottom: 1px solid #d7dde3;
        padding: 0.625rem;
        text-align: left;
        vertical-align: top;
      }

      td {
        overflow-wrap: anywhere;
      }

      .empty {
        color: #52606d;
        margin-top: 1rem;
      }

      .error,
      .error-list {
        color: #a33131;
        margin-top: 1rem;
      }

      .editor {
        margin: 0 1rem 1rem;
      }

      form,
      label {
        display: grid;
        gap: 0.5rem;
      }

      form {
        margin-top: 1rem;
        max-width: 36rem;
      }

      input,
      select {
        border: 1px solid #b8c2cc;
        padding: 0.5rem;
      }

      @media (max-width: 760px) {
        .toolbar,
        .workspace {
          display: block;
        }

        article {
          margin-top: 1rem;
        }
      }
    `
  ]
})
export class FolderExplorerPageComponent implements OnInit, OnChanges {
  @Input() folderId?: string;

  folders: Folder[] = [];
  contents: ContentRecord[] = [];
  files: StaticFile[] = [];
  schemas: ContentTypeSchemaSummary[] = [];
  selectedFolderId: FolderId = ROOT_FOLDER_ID;
  selectedFolder: Folder | null = null;
  selectedUploadFile: File | null = null;
  loading = false;
  saving = false;
  editorOpen = false;
  editorMode: EditorMode = "create";
  editingContent: ContentRecord | null = null;
  selectedContentTypeName: ContentTypeName | "" = "";
  private _currentSchema: ContentTypeSchemaDefinition | null = null;
  schemaFields: SchemaFieldView[] = [];
  formData: Record<string, string | number | null> = {};
  errorMessage = "";
  fileErrorMessage = "";
  formErrorMessage = "";
  validationMessages: string[] = [];

  constructor(
    @Inject(FolderApiClient)
    private readonly folderApi: FolderApiClient,
    @Inject(ContentApiClient)
    private readonly contentApi: ContentApiClient,
    @Inject(ContentTypeApiClient)
    private readonly contentTypeApi: ContentTypeApiClient,
    @Inject(StaticFileApiClient)
    private readonly staticFileApi: StaticFileApiClient
  ) {}

  get currentSchema(): ContentTypeSchemaDefinition | null {
    return this._currentSchema;
  }

  set currentSchema(schema: ContentTypeSchemaDefinition | null) {
    this._currentSchema = schema;
    this.schemaFields = Object.entries(schema?.fields ?? {}).map(([name, definition]) => ({
      name,
      definition
    }));
  }

  ngOnInit(): void {
    void this.loadWorkspace((this.folderId as FolderId | undefined) ?? ROOT_FOLDER_ID);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes["folderId"] || changes["folderId"].firstChange) {
      return;
    }

    void this.selectFolder((this.folderId as FolderId | undefined) ?? ROOT_FOLDER_ID);
  }

  async loadWorkspace(folderId: FolderId): Promise<void> {
    this.loading = true;
    this.errorMessage = "";

    try {
      this.folders = await this.folderApi.listFolders();
      await this.selectFolder(folderId);
    } catch (error) {
      this.applyPageError(error);
    } finally {
      this.loading = false;
    }
  }

  async selectFolder(folderId: FolderId): Promise<void> {
    this.selectedFolderId = folderId;
    this.selectedFolder = this.folders.find((folder) => folder.folderId === folderId) ?? null;
    this.loading = true;
    this.errorMessage = "";
    this.fileErrorMessage = "";

    try {
      const [contents, files] = await Promise.all([
        this.contentApi.listContents(folderId),
        this.staticFileApi.listFiles(folderId)
      ]);

      this.contents = contents;
      this.files = files;
    } catch (error) {
      this.applyPageError(error);
    } finally {
      this.loading = false;
    }
  }

  selectUploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.selectedUploadFile = input.files?.[0] ?? null;
    this.fileErrorMessage = "";
  }

  async uploadSelectedFile(): Promise<void> {
    if (!this.selectedUploadFile) {
      this.fileErrorMessage = "Choose a file to upload.";
      return;
    }

    this.saving = true;
    this.fileErrorMessage = "";

    try {
      await this.staticFileApi.uploadFile(this.selectedFolderId, this.selectedUploadFile);
      this.selectedUploadFile = null;
      await this.selectFolder(this.selectedFolderId);
    } catch (error) {
      this.applyFileError(error);
    } finally {
      this.saving = false;
    }
  }

  async renameFile(file: StaticFile): Promise<void> {
    const filename =
      typeof globalThis.prompt === "function"
        ? globalThis.prompt("Rename file", file.filename)
        : file.filename;

    if (filename === null || filename === file.filename) {
      return;
    }

    this.fileErrorMessage = "";

    try {
      await this.staticFileApi.renameFile(file.fileId, { filename });
      await this.selectFolder(this.selectedFolderId);
    } catch (error) {
      this.applyFileError(error);
    }
  }

  async confirmDeleteFile(file: StaticFile): Promise<void> {
    const confirmed =
      typeof globalThis.confirm === "function"
        ? globalThis.confirm(`Delete ${file.filename}?`)
        : true;

    if (!confirmed) {
      return;
    }

    try {
      await this.staticFileApi.deleteFile(file.fileId);
      this.files = this.files.filter((item) => item.fileId !== file.fileId);
    } catch (error) {
      const apiError = error as Partial<ApiClientError>;
      const message = apiError.message ?? "Request failed.";

      this.applyFileError(error);

      if (apiError.status === 404) {
        await this.selectFolder(this.selectedFolderId);
        this.fileErrorMessage = message;
      }
    }
  }

  async openCreate(): Promise<void> {
    this.editorMode = "create";
    this.editingContent = null;
    this.editorOpen = true;
    this.currentSchema = null;
    this.selectedContentTypeName = "";
    this.formData = {};
    this.clearFormErrors();

    try {
      this.schemas = await this.contentTypeApi.listSchemas();
      const firstSchema = this.schemas[0];

      if (!firstSchema) {
        this.formErrorMessage = "No content type schemas are available.";
        return;
      }

      this.selectedContentTypeName = firstSchema.name;
      await this.chooseContentType(firstSchema.name);
    } catch (error) {
      this.applyFormError(error);
    }
  }

  async chooseSelectedContentType(): Promise<void> {
    if (!this.selectedContentTypeName) {
      return;
    }

    await this.chooseContentType(this.selectedContentTypeName);
  }

  async chooseContentType(contentType: ContentTypeName): Promise<void> {
    if (this.currentSchema?.name === contentType) {
      return;
    }

    this.selectedContentTypeName = contentType;
    this.clearFormErrors();

    try {
      this.currentSchema = await this.contentTypeApi.getLatestSchema(contentType);
      this.formData = createEmptyFormData(this.currentSchema);
    } catch (error) {
      this.applyFormError(error);
    }
  }

  async openEdit(content: ContentRecord): Promise<void> {
    this.editorMode = "edit";
    this.editingContent = content;
    this.editorOpen = true;
    this.selectedContentTypeName = content.contentType;
    this.clearFormErrors();

    try {
      this.currentSchema = await this.contentTypeApi.getSchemaVersion(
        content.contentType,
        content.schemaVersion
      );
      this.formData = createFormData(this.currentSchema, content.data);
    } catch (error) {
      this.applyFormError(error);
    }
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.currentSchema = null;
    this.editingContent = null;
    this.selectedContentTypeName = "";
    this.formData = {};
    this.clearFormErrors();
  }

  async submitEditor(): Promise<void> {
    if (!this.currentSchema || !this.validateRequiredFields()) {
      return;
    }

    this.saving = true;
    this.clearFormErrors();

    try {
      const data = toContentData(this.currentSchema, this.formData);

      if (this.editorMode === "create") {
        await this.contentApi.createContent({
          folderId: this.selectedFolderId,
          contentType: this.currentSchema.name,
          schemaVersion: this.currentSchema.version,
          data
        });
      } else if (this.editingContent) {
        await this.contentApi.replaceContent(this.editingContent.contentId, {
          folderId: this.editingContent.folderId,
          contentType: this.editingContent.contentType,
          schemaVersion: this.editingContent.schemaVersion,
          data
        });
      }

      this.closeEditor();
      await this.selectFolder(this.selectedFolderId);
    } catch (error) {
      this.applyFormError(error);
    } finally {
      this.saving = false;
    }
  }

  async confirmDelete(content: ContentRecord): Promise<void> {
    const confirmed =
      typeof globalThis.confirm === "function"
        ? globalThis.confirm(`Delete ${content.contentId}?`)
        : true;

    if (!confirmed) {
      return;
    }

    try {
      await this.contentApi.deleteContent(content.contentId);
      this.contents = this.contents.filter((item) => item.contentId !== content.contentId);
    } catch (error) {
      const apiError = error as Partial<ApiClientError>;
      const message = apiError.message ?? "Request failed.";

      this.applyPageError(error);

      if (apiError.status === 404) {
        await this.selectFolder(this.selectedFolderId);
        this.errorMessage = message;
      }
    }
  }

  inputType(fieldType: ContentFieldType): string {
    if (fieldType === "integer") {
      return "number";
    }

    if (fieldType === "date" || fieldType === "time") {
      return fieldType;
    }

    return "text";
  }

  trackSchemaSummary(_index: number, schema: ContentTypeSchemaSummary): string {
    return `${schema.name}:${schema.version}`;
  }

  trackSchemaField(_index: number, field: SchemaFieldView): string {
    return field.name;
  }

  private validateRequiredFields(): boolean {
    const missingFields = this.schemaFields
      .filter((field) => field.definition.required)
      .filter((field) => this.formData[field.name] === "" || this.formData[field.name] === null)
      .map((field) => `${field.name} is required.`);

    this.validationMessages = missingFields;
    this.formErrorMessage = missingFields.length > 0 ? "Please complete required fields." : "";

    return missingFields.length === 0;
  }

  private applyPageError(error: unknown): void {
    const apiError = error as Partial<ApiClientError>;

    this.errorMessage = apiError.message ?? "Request failed.";
  }

  private applyFormError(error: unknown): void {
    const apiError = error as Partial<ApiClientError>;

    this.formErrorMessage = apiError.message ?? "Request failed.";
    this.validationMessages = apiError.validationMessages ?? [];
  }

  private applyFileError(error: unknown): void {
    const apiError = error as Partial<ApiClientError>;

    this.fileErrorMessage = apiError.message ?? "Request failed.";
  }

  private clearFormErrors(): void {
    this.formErrorMessage = "";
    this.validationMessages = [];
  }
}

function createEmptyFormData(
  schema: ContentTypeSchemaDefinition
): Record<string, string | number | null> {
  return Object.fromEntries(
    Object.entries(schema.fields).map(([fieldName, definition]) => [
      fieldName,
      definition.type === "integer" ? null : ""
    ])
  );
}

function createFormData(
  schema: ContentTypeSchemaDefinition,
  data: Record<string, unknown>
): Record<string, string | number | null> {
  return Object.fromEntries(
    Object.keys(schema.fields).map((fieldName) => {
      const value = data[fieldName];

      return [fieldName, typeof value === "string" || typeof value === "number" ? value : ""];
    })
  );
}

function toContentData(
  schema: ContentTypeSchemaDefinition,
  formData: Record<string, string | number | null>
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const [fieldName, definition] of Object.entries(schema.fields)) {
    const value = formData[fieldName];

    if (value === "" || value === null) {
      continue;
    }

    data[fieldName] = definition.type === "integer" ? Number(value) : value;
  }

  return data;
}
