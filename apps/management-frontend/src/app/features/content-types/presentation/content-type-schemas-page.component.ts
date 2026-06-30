import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  ContentTypeFieldDefinition,
  ContentTypeName,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  ContentTypeVersion
} from "@ecmp/shared-types";

import type { ApiClientError } from "../../../shared/infrastructure/api-client-error";
import { ContentTypeApiClient } from "../infrastructure/content-type-api.client";

interface SchemaFieldView {
  name: string;
  definition: ContentTypeFieldDefinition;
}

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

            <table *ngIf="schemaFields.length > 0">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let field of schemaFields">
                  <td>{{ field.name }}</td>
                  <td>{{ field.definition.type }}</td>
                  <td>{{ field.definition.required ? "Yes" : "No" }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="forms-grid" aria-label="Schema YAML forms">
            <form (ngSubmit)="createFromYaml()" aria-label="Create schema">
              <h2>Create</h2>
              <textarea
                name="createSchemaSource"
                [(ngModel)]="createSource"
                rows="14"
                spellcheck="false"
              ></textarea>
              <p *ngIf="createErrorMessage" class="error">{{ createErrorMessage }}</p>
              <ul *ngIf="createValidationMessages.length > 0" class="error-list">
                <li *ngFor="let message of createValidationMessages">{{ message }}</li>
              </ul>
              <button type="submit" [disabled]="saving">Create schema</button>
            </form>

            <form (ngSubmit)="replaceFromYaml()" aria-label="Replace schema">
              <h2>Replace Selected</h2>
              <textarea
                name="replaceSchemaSource"
                [(ngModel)]="replaceSource"
                rows="14"
                spellcheck="false"
                [disabled]="!selectedSchema"
              ></textarea>
              <p *ngIf="replaceErrorMessage" class="error">{{ replaceErrorMessage }}</p>
              <ul *ngIf="replaceValidationMessages.length > 0" class="error-list">
                <li *ngFor="let message of replaceValidationMessages">{{ message }}</li>
              </ul>
              <button type="submit" [disabled]="saving || !selectedSchema">
                Replace schema
              </button>
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

      textarea {
        border: 1px solid #b8c2cc;
        box-sizing: border-box;
        font-family: Consolas, "Liberation Mono", monospace;
        line-height: 1.4;
        max-width: 100%;
        min-height: 18rem;
        padding: 0.75rem;
        resize: vertical;
        width: 100%;
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
  createSource = defaultSchemaSource();
  replaceSource = "";
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

  get schemaFields(): SchemaFieldView[] {
    return Object.entries(this.selectedSchema?.fields ?? {}).map(([name, definition]) => ({
      name,
      definition
    }));
  }

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
        this.replaceSource = "";
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
      this.replaceSource = schemaToYaml(this.selectedSchema);
    } catch (error) {
      this.selectedSchema = null;
      this.replaceSource = "";
      this.applyDetailError(error);
    } finally {
      this.detailLoading = false;
    }
  }

  async createFromYaml(): Promise<void> {
    this.saving = true;
    this.clearCreateErrors();

    try {
      const created = await this.contentTypeApi.createSchema(this.createSource);
      await this.refreshAfterWrite(created);
    } catch (error) {
      this.applyCreateError(error);
    } finally {
      this.saving = false;
    }
  }

  async replaceFromYaml(): Promise<void> {
    if (!this.selectedSchema) {
      return;
    }

    this.saving = true;
    this.clearReplaceErrors();

    try {
      const replaced = await this.contentTypeApi.replaceSchemaVersion(
        this.selectedSchema.name,
        this.selectedSchema.version,
        this.replaceSource
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
      this.replaceSource = "";
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

function defaultSchemaSource(): string {
  return `name: article
version: 1.0
fields:
  title:
    type: string
    required: true
`;
}

function schemaToYaml(schema: ContentTypeSchemaDefinition): string {
  const fields = Object.entries(schema.fields)
    .map(
      ([name, definition]) =>
        `  ${name}:\n    type: ${definition.type}\n    required: ${definition.required}`
    )
    .join("\n");

  return `name: ${schema.name}
version: ${schema.version}
fields:
${fields}
`;
}
