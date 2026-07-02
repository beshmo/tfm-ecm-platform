import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { Folder, FolderId } from "@ecmp/shared-types";

@Component({
  selector: "ecmp-folder-picker-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button type="button" class="close-btn" (click)="onClose()" aria-label="Close">&times;</button>
        </div>

        <div class="modal-body">
          <ng-container *ngIf="mode === 'create-folder'">
            <label>
              New folder name
              <input
                name="newFolderName"
                [(ngModel)]="newFolderName"
                (keyup.enter)="onConfirmCreate()"
              />
            </label>
            <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
          </ng-container>

          <ng-container *ngIf="mode === 'move'">
            <p *ngIf="folders.length === 0" class="empty">No folders available.</p>
            <button
              *ngFor="let folder of folders; trackBy: trackFolderById"
              type="button"
              class="folder-option"
              (click)="onSelect(folder)"
            >
              {{ folder.path }}
            </button>
          </ng-container>
        </div>

        <div class="modal-footer">
          <button type="button" class="secondary" (click)="onClose()">Cancel</button>
          <button
            *ngIf="mode === 'create-folder'"
            type="button"
            (click)="onConfirmCreate()"
            [disabled]="saving || !newFolderName.trim()"
          >
            {{ saving ? "Creating..." : "Create" }}
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
        max-width: 36rem;
        min-width: 24rem;
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
      input {
        border: 1px solid #b8c2cc;
        padding: 0.5rem;
      }
      .folder-option {
        background: transparent;
        border: 1px solid #d7dde3;
        color: #18212b;
        display: block;
        padding: 0.5rem 0.75rem;
        text-align: left;
        width: 100%;
      }
      .folder-option:hover {
        background: #e8f1f8;
        border-color: #1c5d99;
      }
      .empty {
        color: #52606d;
      }
      .error {
        color: #a33131;
        overflow-wrap: anywhere;
      }
    `
  ]
})
export class FolderPickerModalComponent {
  @Input() mode: "move" | "create-folder" = "move";
  @Input() folders: Folder[] = [];
  @Input() title = "";
  @Output() selected = new EventEmitter<FolderId>();
  @Output() folderCreated = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  newFolderName = "";
  saving = false;
  errorMessage = "";

  onClose(): void {
    this.closed.emit();
  }

  onSelect(folder: Folder): void {
    this.selected.emit(folder.folderId);
  }

  onConfirmCreate(): void {
    const name = this.newFolderName.trim();
    if (!name) {
      return;
    }
    this.folderCreated.emit(name);
  }

  trackFolderById(_index: number, folder: Folder): string {
    return folder.folderId;
  }
}
