import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  ContentFieldType,
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";

import type { ApiClientError } from "../../../shared/infrastructure/api-client-error";
import { ContentTypeApiClient } from "../infrastructure/content-type-api.client";

interface SchemaFieldDraft {
  name: string;
  type: ContentFieldType;
  required: boolean;
}

interface SchemaDraft {
  name: string;
  version: string;
  fields: SchemaFieldDraft[];
}

const FIELD_TYPES: readonly ContentFieldType[] = [
  "string",
  "integer",
  "date",
  "time",
  "boolean",
  "datetime",
  "decimal",
  "html",
  "uri"
];

@Component({
  selector: "ecmp-content-type-schemas-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="shell">
      <header class="toolbar">
        <div>
          <h1>Content Type Schemas</h1>
          <p>{{ schemas.length }} active versions</p>
        </div>
        <button type="button" class="secondary" (click)="loadSchemas()" [disabled]="loading">
          Refresh
        </button>
      </header>

      <section class="workspace" aria-label="Content type schema administration">
        <aside aria-label="Content type schemas">
          <h2>Schemas</h2>
          <p *ngIf="loading && schemas.length === 0">Loading schemas...</p>
          <p *ngIf="pageErrorMessage" class="error">{{ pageErrorMessage }}</p>
          <p *ngIf="!loading && !pageErrorMessage && schemas.length === 0" class="empty">
            No active schema versions.
          </p>
          <button
            *ngFor="let schema of schemas"
            type="button"
            class="schema-button"
            [class.active]="isSelected(schema)"
            (click)="selectSchema(schema)"
          >
            <strong>{{ schema.name }}</strong>
            <span>{{ schema.version }}</span>
          </button>
        </aside>

        <article>
          <section aria-label="Selected schema details">
            <div class="content-header">
              <h2>Details</h2>
              <button
                type="button"
                class="secondary"
                (click)="confirmDeactivate()"
                [disabled]="!selectedSummary || saving"
              >
                Deactivate
              </button>
            </div>

            <p *ngIf="detailLoading">Loading schema...</p>
            <p *ngIf="detailErrorMessage" class="error">{{ detailErrorMessage }}</p>

            <div *ngIf="selectedSchema" class="details-grid">
              <span>Name</span>
              <strong>{{ selectedSchema.name }}</strong>
              <span>Version</span>
              <strong>{{ selectedSchema.version }}</strong>
              <span>Active</span>
              <strong>{{ selectedSummary?.active ? "Yes" : "No" }}</strong>
            </div>

            <table *ngIf="selectedSchema && selectedSchema.fields.length > 0">
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
          </section>

          <section class="forms-grid" aria-label="Schema forms">
            <form (ngSubmit)="createSchema()" aria-label="Create schema">
              <h2>Create</h2>
              <label>
                Name
                <input name="createSchemaName" [(ngModel)]="createDraft.name" />
              </label>
              <label>
                Version
                <input name="createSchemaVersion" [(ngModel)]="createDraft.version" />
              </label>

              <div class="fields-editor" aria-label="Create schema fields">
                <div
                  class="field-row"
                  *ngFor="let field of createDraft.fields; let i = index; trackBy: trackFieldByIndex"
                >
                  <input
                    [name]="'createFieldName-' + i"
                    [attr.data-name]="'createFieldName-' + i"
                    [(ngModel)]="field.name"
                    placeholder="Field name"
                    aria-label="Field name"
                  />
                  <select
                    [name]="'createFieldType-' + i"
                    [attr.data-name]="'createFieldType-' + i"
                    [(ngModel)]="field.type"
                    aria-label="Field type"
                  >
                    <option *ngFor="let type of fieldTypes" [value]="type">{{ type }}</option>
                  </select>
                  <label class="required-toggle">
                    <input
                      type="checkbox"
                      [name]="'createFieldRequired-' + i"
                      [attr.data-name]="'createFieldRequired-' + i"
                      [(ngModel)]="field.required"
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    class="secondary"
                    (click)="moveCreateField(i, -1)"
                    [disabled]="i === 0"
                    aria-label="Move field up"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    class="secondary"
                    (click)="moveCreateField(i, 1)"
                    [disabled]="i === createDraft.fields.length - 1"
                    aria-label="Move field down"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    class="secondary"
                    (click)="removeCreateField(i)"
                    aria-label="Remove field"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <button type="button" class="secondary" (click)="addCreateField()">Add field</button>

              <p *ngIf="createErrorMessage" class="error">{{ createErrorMessage }}</p>
              <ul *ngIf="createValidationMessages.length > 0" class="error-list">
                <li *ngFor="let message of createValidationMessages">{{ message }}</li>
              </ul>
              <button type="submit" [disabled]="saving">Create schema</button>
            </form>

            <form (ngSubmit)="replaceSchema()" aria-label="Replace schema">
              <h2>Replace Selected</h2>
              <p *ngIf="!replaceDraft" class="empty">Select a schema to replace.</p>

              <ng-container *ngIf="replaceDraft as draft">
                <label>
                  Name
                  <input name="replaceSchemaName" [ngModel]="draft.name" disabled />
                </label>
                <label>
                  Version
                  <input name="replaceSchemaVersion" [ngModel]="draft.version" disabled />
                </label>

                <div class="fields-editor" aria-label="Replace schema fields">
                  <div
                    class="field-row"
                    *ngFor="let field of draft.fields; let i = index; trackBy: trackFieldByIndex"
                  >
                    <input
                      [name]="'replaceFieldName-' + i"
                      [attr.data-name]="'replaceFieldName-' + i"
                      [(ngModel)]="field.name"
                      placeholder="Field name"
                      aria-label="Field name"
                    />
                    <select
                      [name]="'replaceFieldType-' + i"
                      [attr.data-name]="'replaceFieldType-' + i"
                      [(ngModel)]="field.type"
                      aria-label="Field type"
                    >
                      <option *ngFor="let type of fieldTypes" [value]="type">{{ type }}</option>
                    </select>
                    <label class="required-toggle">
                      <input
                        type="checkbox"
                        [name]="'replaceFieldRequired-' + i"
                        [attr.data-name]="'replaceFieldRequired-' + i"
                        [(ngModel)]="field.required"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      class="secondary"
                      (click)="moveReplaceField(i, -1)"
                      [disabled]="i === 0"
                      aria-label="Move field up"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      class="secondary"
                      (click)="moveReplaceField(i, 1)"
                      [disabled]="i === draft.fields.length - 1"
                      aria-label="Move field down"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      class="secondary"
                      (click)="removeReplaceField(i)"
                      aria-label="Remove field"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <button type="button" class="secondary" (click)="addReplaceField()">
                  Add field
                </button>
              </ng-container>

              <p *ngIf="replaceErrorMessage" class="error">{{ replaceErrorMessage }}</p>
              <ul *ngIf="replaceValidationMessages.length > 0" class="error-list">
                <li *ngFor="let message of replaceValidationMessages">{{ message }}</li>
              </ul>
              <button type="submit" [disabled]="saving || !replaceDraft">Replace schema</button>
            </form>
          </section>
        </article>
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
      article {
        background: #ffffff;
        border: 1px solid #d7dde3;
        min-width: 0;
        padding: 1rem;
      }

      aside {
        align-self: start;
      }

      .schema-button {
        align-items: start;
        background: transparent;
        color: #18212b;
        display: grid;
        gap: 0.25rem;
        margin-top: 0.5rem;
        overflow-wrap: anywhere;
        text-align: left;
        width: 100%;
      }

      .schema-button span {
        color: #52606d;
      }

      .schema-button.active {
        background: #e8f1f8;
        color: #124b7c;
      }

      .content-header {
        align-items: center;
        display: flex;
        gap: 0.5rem;
        justify-content: space-between;
      }

      .details-grid {
        display: grid;
        gap: 0.5rem 1rem;
        grid-template-columns: max-content 1fr;
        margin-top: 1rem;
      }

      .details-grid span {
        color: #52606d;
      }

      table {
        border-collapse: collapse;
        margin-top: 1rem;
        width: 100%;
      }

      th,
      td {
        border-bottom: 1px solid #d7dde3;
        padding: 0.625rem;
        text-align: left;
        vertical-align: top;
      }

      .forms-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 1.5rem;
      }

      form {
        display: grid;
        gap: 0.75rem;
        min-width: 0;
      }

      form label {
        display: grid;
        gap: 0.25rem;
      }

      input,
      select {
        border: 1px solid #b8c2cc;
        padding: 0.5rem;
      }

      .fields-editor {
        display: grid;
        gap: 0.5rem;
      }

      .field-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .field-row input[type="text"],
      .field-row > input {
        flex: 1 1 8rem;
        min-width: 0;
      }

      .required-toggle {
        align-items: center;
        display: flex;
        gap: 0.25rem;
        white-space: nowrap;
      }

      .empty {
        color: #52606d;
        margin-top: 1rem;
      }

      .error,
      .error-list {
        color: #a33131;
        margin-top: 0.75rem;
        overflow-wrap: anywhere;
      }

      @media (max-width: 860px) {
        .toolbar,
        .workspace,
        .forms-grid {
          display: block;
        }

        article,
        form + form {
          margin-top: 1rem;
        }
      }
    `
  ]
})
export class ContentTypeSchemasPageComponent implements OnInit {
  schemas: ContentTypeSchemaSummary[] = [];
  selectedSummary: ContentTypeSchemaSummary | null = null;
  selectedSchema: ContentTypeSchemaDefinition | null = null;
  readonly fieldTypes = FIELD_TYPES;
  createDraft: SchemaDraft = defaultCreateDraft();
  replaceDraft: SchemaDraft | null = null;
  loading = false;
  detailLoading = false;
  saving = false;
  pageErrorMessage = "";
  detailErrorMessage = "";
  createErrorMessage = "";
  createValidationMessages: string[] = [];
  replaceErrorMessage = "";
  replaceValidationMessages: string[] = [];

  constructor(
    @Inject(ContentTypeApiClient)
    private readonly contentTypeApi: ContentTypeApiClient
  ) {}

  ngOnInit(): void {
    void this.loadSchemas();
  }

  async loadSchemas(): Promise<void> {
    this.loading = true;
    this.pageErrorMessage = "";

    try {
      this.schemas = await this.contentTypeApi.listSchemas();
      const selected = this.findSummary(
        this.selectedSchema?.name,
        this.selectedSchema?.version
      );
      const nextSummary = selected ?? this.schemas[0] ?? null;

      if (nextSummary) {
        await this.selectSchema(nextSummary);
      } else {
        this.selectedSummary = null;
        this.selectedSchema = null;
        this.replaceDraft = null;
      }
    } catch (error) {
      this.applyPageError(error);
    } finally {
      this.loading = false;
    }
  }

  async selectSchema(summary: ContentTypeSchemaSummary): Promise<void> {
    this.selectedSummary = summary;
    this.detailLoading = true;
    this.detailErrorMessage = "";
    this.clearReplaceErrors();

    try {
      this.selectedSchema = await this.contentTypeApi.getSchemaVersion(
        summary.name,
        summary.version
      );
      this.replaceDraft = draftFromSchema(this.selectedSchema);
    } catch (error) {
      this.selectedSchema = null;
      this.replaceDraft = null;
      this.applyDetailError(error);
    } finally {
      this.detailLoading = false;
    }
  }

  addCreateField(): void {
    this.createDraft.fields.push(emptyFieldDraft());
  }

  removeCreateField(index: number): void {
    this.createDraft.fields.splice(index, 1);
  }

  moveCreateField(index: number, direction: -1 | 1): void {
    moveField(this.createDraft.fields, index, direction);
  }

  addReplaceField(): void {
    this.replaceDraft?.fields.push(emptyFieldDraft());
  }

  removeReplaceField(index: number): void {
    this.replaceDraft?.fields.splice(index, 1);
  }

  moveReplaceField(index: number, direction: -1 | 1): void {
    if (this.replaceDraft) {
      moveField(this.replaceDraft.fields, index, direction);
    }
  }

  async createSchema(): Promise<void> {
    this.saving = true;
    this.clearCreateErrors();

    try {
      const created = await this.contentTypeApi.createSchema(draftToYaml(this.createDraft));
      await this.refreshAfterWrite(created);
    } catch (error) {
      this.applyCreateError(error);
    } finally {
      this.saving = false;
    }
  }

  async replaceSchema(): Promise<void> {
    if (!this.selectedSchema || !this.replaceDraft) {
      return;
    }

    this.saving = true;
    this.clearReplaceErrors();

    try {
      const replaced = await this.contentTypeApi.replaceSchemaVersion(
        this.selectedSchema.name,
        this.selectedSchema.version,
        draftToYaml(this.replaceDraft)
      );
      await this.refreshAfterWrite(replaced);
    } catch (error) {
      const apiError = error as Partial<ApiClientError>;
      const message = apiError.message ?? "Request failed.";
      const validationMessages = apiError.validationMessages ?? [];

      this.applyReplaceError(error);

      if (apiError.status === 404) {
        await this.loadSchemas();
        this.replaceErrorMessage = message;
        this.replaceValidationMessages = validationMessages;
      }
    } finally {
      this.saving = false;
    }
  }

  async confirmDeactivate(): Promise<void> {
    if (!this.selectedSummary) {
      return;
    }

    const confirmed =
      typeof globalThis.confirm === "function"
        ? globalThis.confirm(
            `Deactivate ${this.selectedSummary.name} ${this.selectedSummary.version}?`
          )
        : true;

    if (!confirmed) {
      return;
    }

    this.saving = true;
    this.detailErrorMessage = "";

    try {
      await this.contentTypeApi.deactivateSchemaVersion(
        this.selectedSummary.name,
        this.selectedSummary.version
      );
      this.selectedSchema = null;
      this.selectedSummary = null;
      this.replaceDraft = null;
      await this.loadSchemas();
    } catch (error) {
      const apiError = error as Partial<ApiClientError>;
      const message = apiError.message ?? "Request failed.";

      this.applyDetailError(error);
      await this.loadSchemas();
      this.detailErrorMessage = message;
    } finally {
      this.saving = false;
    }
  }

  isSelected(summary: ContentTypeSchemaSummary): boolean {
    const selected = this.selectedSummary;

    return selected !== null && summary.name === selected.name && summary.version === selected.version;
  }

  trackFieldByIndex(index: number): number {
    return index;
  }

  private async refreshAfterWrite(schema: ContentTypeSchemaDefinition): Promise<void> {
    this.selectedSchema = schema;
    this.selectedSummary = {
      name: schema.name,
      version: schema.version,
      active: true
    };
    await this.loadSchemas();
    const summary = this.findSummary(schema.name, schema.version);

    if (summary) {
      await this.selectSchema(summary);
    }
  }

  private findSummary(
    name: ContentTypeName | undefined,
    version: ContentTypeVersion | undefined
  ): ContentTypeSchemaSummary | null {
    if (!name || !version) {
      return null;
    }

    return (
      this.schemas.find((schema) => schema.name === name && schema.version === version) ?? null
    );
  }

  private applyPageError(error: unknown): void {
    const apiError = error as Partial<ApiClientError>;

    this.pageErrorMessage = apiError.message ?? "Request failed.";
  }

  private applyDetailError(error: unknown): void {
    const apiError = error as Partial<ApiClientError>;

    this.detailErrorMessage = apiError.message ?? "Request failed.";
  }

  private applyCreateError(error: unknown): void {
    const apiError = error as Partial<ApiClientError>;

    this.createErrorMessage = apiError.message ?? "Request failed.";
    this.createValidationMessages = apiError.validationMessages ?? [];
  }

  private applyReplaceError(error: unknown): void {
    const apiError = error as Partial<ApiClientError>;

    this.replaceErrorMessage = apiError.message ?? "Request failed.";
    this.replaceValidationMessages = apiError.validationMessages ?? [];
  }

  private clearCreateErrors(): void {
    this.createErrorMessage = "";
    this.createValidationMessages = [];
  }

  private clearReplaceErrors(): void {
    this.replaceErrorMessage = "";
    this.replaceValidationMessages = [];
  }
}

function emptyFieldDraft(): SchemaFieldDraft {
  return { name: "", type: "string", required: false };
}

function defaultCreateDraft(): SchemaDraft {
  return {
    name: "article",
    version: "1.0",
    fields: [{ name: "title", type: "string", required: true }]
  };
}

function draftFromSchema(schema: ContentTypeSchemaDefinition): SchemaDraft {
  return {
    name: schema.name,
    version: schema.version,
    fields: schema.fields.map((field) => ({
      name: field.name,
      type: field.type,
      required: field.required
    }))
  };
}

function moveField(fields: SchemaFieldDraft[], index: number, direction: -1 | 1): void {
  const target = index + direction;

  if (target < 0 || target >= fields.length) {
    return;
  }

  const [moved] = fields.splice(index, 1);

  if (moved) {
    fields.splice(target, 0, moved);
  }
}

function draftToYaml(draft: SchemaDraft): string {
  const fields = draft.fields
    .map(
      (field) =>
        `  - name: ${field.name}\n    type: ${field.type}\n    required: ${field.required}`
    )
    .join("\n");

  return `name: ${draft.name}
version: ${draft.version}
fields:
${fields}
`;
}
