import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Inject, Input, Output, forwardRef } from "@angular/core";
import type { Folder, FolderId } from "@ecmp/shared-types";

import { ContentTypeApiClient } from "../infrastructure/content-type-api.client";

@Component({
  selector: "ecmp-schema-folder-tree",
  standalone: true,
  imports: [CommonModule, forwardRef(() => SchemaFolderTreeComponent)],
  template: `
    <ul class="tree-list">
      <li *ngFor="let folder of folders; trackBy: trackFolderById" class="tree-node">
        <div
          class="tree-row"
          [class.selected]="folder.folderId === selectedFolderId"
          (click)="select(folder)"
        >
          <button
            type="button"
            class="toggle-btn"
            (click)="toggle($event, folder)"
            [attr.aria-label]="(expanded.has(folder.folderId) ? 'Collapse' : 'Expand') + ' ' + folder.name"
          >
            {{ expanded.has(folder.folderId) ? "▼" : "▶" }}
          </button>
          <span class="folder-name">{{ folder.name }}</span>
          <span *ngIf="loading.has(folder.folderId)" class="loading-indicator">...</span>
        </div>
        <ecmp-schema-folder-tree
          *ngIf="expanded.has(folder.folderId) && children.get(folder.folderId) as childFolders"
          [folders]="childFolders"
          [selectedFolderId]="selectedFolderId"
          (selectFolder)="selectFolder.emit($event)"
        />
      </li>
    </ul>
  `,
  styles: [
    `
      .tree-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .tree-node {
        margin: 0;
        padding: 0;
      }
      .tree-row {
        align-items: center;
        cursor: pointer;
        display: flex;
        gap: 0.25rem;
        padding: 0.375rem 0.5rem;
      }
      .tree-row:hover {
        background: #e8f1f8;
      }
      .tree-row.selected {
        background: #cfe3f0;
        font-weight: 600;
      }
      .toggle-btn {
        background: transparent;
        border: 0;
        color: #52606d;
        cursor: pointer;
        flex-shrink: 0;
        font-size: 0.75rem;
        padding: 0;
        width: 1rem;
      }
      .folder-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .loading-indicator {
        color: #52606d;
        font-size: 0.75rem;
        margin-left: auto;
      }
    `
  ]
})
export class SchemaFolderTreeComponent {
  @Input() folders: Folder[] = [];
  @Input() selectedFolderId: FolderId | null = null;
  @Output() selectFolder = new EventEmitter<Folder>();

  expanded = new Set<FolderId>();
  children = new Map<FolderId, Folder[]>();
  loading = new Set<FolderId>();

  constructor(
    @Inject(ContentTypeApiClient)
    private readonly contentTypeApi: ContentTypeApiClient
  ) {}

  toggle(event: MouseEvent, folder: Folder): void {
    event.stopPropagation();
    if (this.expanded.has(folder.folderId)) {
      this.expanded.delete(folder.folderId);
      return;
    }
    this.expanded.add(folder.folderId);
    if (!this.children.has(folder.folderId)) {
      void this.loadChildren(folder);
    }
  }

  select(folder: Folder): void {
    this.selectFolder.emit(folder);
  }

  private async loadChildren(folder: Folder): Promise<void> {
    this.loading.add(folder.folderId);
    try {
      const subfolders = await this.contentTypeApi.listSchemaSubfolders(folder.folderId);
      this.children.set(folder.folderId, subfolders);
    } finally {
      this.loading.delete(folder.folderId);
    }
  }

  reloadFolder(folderId: FolderId): void {
    if (this.expanded.has(folderId)) {
      this.children.delete(folderId);
      void this.doLoad(folderId);
    }
  }

  private async doLoad(folderId: FolderId): Promise<void> {
    this.loading.add(folderId);
    try {
      const subfolders = await this.contentTypeApi.listSchemaSubfolders(folderId);
      this.children.set(folderId, subfolders);
    } finally {
      this.loading.delete(folderId);
    }
  }

  trackFolderById(_index: number, folder: Folder): string {
    return folder.folderId;
  }
}
