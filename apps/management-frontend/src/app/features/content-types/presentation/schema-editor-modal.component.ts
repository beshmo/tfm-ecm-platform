import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type {
  ContentFieldType,
  ContentTypeSchemaDefinition
} from "@ecmp/shared-types";

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
  selector: "ecmp-schema-editor-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ mode === "create" ? "Create Schema" : "Edit Schema" }}</h2>
          <button type="button" class="close-btn" (click)="onClose()" aria-label="Close">&times;</button>
        </div>

        <div class="modal-body">
          <label>
            Name
            <input
              name="schemaName"
              [(ngModel)]="draft.name"
              [disabled]="mode === 'edit'"
            />
          </label>
          <label>
            Version
            <input
              name="schemaVersion"
              [(ngModel)]="draft.version"
              [disabled]="mode === 'edit'"
            />
          </label>

          <div class="fields-editor" aria-label="Schema fields">
            <div
              class="field-row"
              *ngFor="let field of draft.fields; let i = index; trackBy: trackFieldByIndex"
            >
              <input
                [name]="'fieldName-' + i"
                [attr.data-name]="'fieldName-' + i"
                [(ngModel)]="field.name"
                placeholder="Field name"
                aria-label="Field name"
              />
              <select
                [name]="'fieldType-' + i"
                [attr.data-name]="'fieldType-' + i"
                [(ngModel)]="field.type"
                aria-label="Field type"
              >
                <option *ngFor="let type of fieldTypes" [value]="type">{{ type }}</option>
              </select>
              <label class="required-toggle">
                <input
                  type="checkbox"
                  [name]="'fieldRequired-' + i"
                  [attr.data-name]="'fieldRequired-' + i"
                  [(ngModel)]="field.required"
                />
                Required
              </label>
              <button
                type="button"
                class="secondary"
                (click)="moveField(i, -1)"
                [disabled]="i === 0"
                aria-label="Move field up"
              >
                Up
              </button>
              <button
                type="button"
                class="secondary"
                (click)="moveField(i, 1)"
                [disabled]="i === draft.fields.length - 1"
                aria-label="Move field down"
              >
                Down
              </button>
              <button
                type="button"
                class="secondary"
                (click)="removeField(i)"
                aria-label="Remove field"
              >
                Remove
              </button>
            </div>
          </div>

          <button type="button" class="secondary" (click)="addField()">Add field</button>

          <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
          <ul *ngIf="validationMessages.length > 0" class="error-list">
            <li *ngFor="let message of validationMessages">{{ message }}</li>
          </ul>
        </div>

        <div class="modal-footer">
          <button type="button" class="secondary" (click)="onClose()">Cancel</button>
          <button type="button" (click)="onSave()" [disabled]="saving">
            {{ saving ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-backdrop {
        align-items: center;
        background: rgba(0, 0, 0, 0.4);
        bottom: 0;
        display: flex;
        justify-content: center;
        left: 0;
        position: fixed;
        right: 0;
        top: 0;
        z-index: 1000;
      }
      .modal-panel {
        background: #ffffff;
        border: 1px solid #d7dde3;
        display: flex;
        flex-direction: column;
        max-height: 85vh;
        max-width: 42rem;
        min-width: 30rem;
        width: 90%;
      }
      .modal-header {
        align-items: center;
        border-bottom: 1px solid #d7dde3;
        display: flex;
        justify-content: space-between;
        padding: 1rem 1.25rem;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.125rem;
      }
      .close-btn {
        background: transparent;
        border: 0;
        color: #5d6773;
        cursor: pointer;
        font-size: 1.5rem;
        line-height: 1;
        padding: 0;
      }
      .close-btn:hover {
        color: #18212b;
      }
      .modal-body {
        display: grid;
        gap: 0.75rem;
        overflow-y: auto;
        padding: 1.25rem;
      }
      .modal-body label {
        display: grid;
        gap: 0.25rem;
      }
      .modal-footer {
        align-items: center;
        border-top: 1px solid #d7dde3;
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        padding: 1rem 1.25rem;
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
      .error,
      .error-list {
        color: #a33131;
        margin-top: 0.75rem;
        overflow-wrap: anywhere;
      }
      .error-list {
        margin-top: 0;
      }
    `
  ]
})
export class SchemaEditorModalComponent {
  @Input() mode: "create" | "edit" = "create";
  @Input() set schema(value: ContentTypeSchemaDefinition | null) {
    if (value) {
      this.draft = draftFromSchema(value);
    } else {
      this.draft = defaultCreateDraft();
    }
  }
  @Output() saved = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  draft: SchemaDraft = defaultCreateDraft();
  readonly fieldTypes = FIELD_TYPES;
  saving = false;
  errorMessage = "";
  validationMessages: string[] = [];

  onClose(): void {
    this.closed.emit();
  }

  onSave(): void {
    this.saving = true;
    this.errorMessage = "";
    this.validationMessages = [];
    const yaml = draftToYaml(this.draft);
    this.saved.emit(yaml);
    this.saving = false;
  }

  addField(): void {
    this.draft.fields.push(emptyFieldDraft());
  }

  removeField(index: number): void {
    this.draft.fields.splice(index, 1);
  }

  moveField(index: number, direction: -1 | 1): void {
    moveArrayField(this.draft.fields, index, direction);
  }

  trackFieldByIndex(index: number): number {
    return index;
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

function moveArrayField(fields: SchemaFieldDraft[], index: number, direction: -1 | 1): void {
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
