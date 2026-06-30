import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router, RouterOutlet, withComponentInputBinding } from "@angular/router";
import {
  INITIAL_GENERIC_CONTENT_TYPE_SCHEMA,
  ROOT_FOLDER_ID,
  type ContentRecord,
  type Folder,
  type StaticFile
} from "@ecmp/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContentTypeApiClient } from "./features/content-types/infrastructure/content-type-api.client";
import { ContentApiClient } from "./features/content/infrastructure/content-api.client";
import { StaticFileApiClient } from "./features/content/infrastructure/static-file-api.client";
import { FolderApiClient } from "./features/folders/infrastructure/folder-api.client";
import { routes } from "./app.routes";

@Component({
  standalone: true,
  imports: [RouterOutlet],
  template: "<router-outlet />"
})
class RouteHostComponent {}

describe("management frontend route integration", () => {
  let folderApi: {
    listFolders: ReturnType<typeof vi.fn>;
    getFolder: ReturnType<typeof vi.fn>;
  };
  let contentApi: {
    listContents: ReturnType<typeof vi.fn>;
    createContent: ReturnType<typeof vi.fn>;
    replaceContent: ReturnType<typeof vi.fn>;
    deleteContent: ReturnType<typeof vi.fn>;
  };
  let contentTypeApi: {
    listSchemas: ReturnType<typeof vi.fn>;
    getLatestSchema: ReturnType<typeof vi.fn>;
    getSchemaVersion: ReturnType<typeof vi.fn>;
    createSchema: ReturnType<typeof vi.fn>;
    replaceSchemaVersion: ReturnType<typeof vi.fn>;
    deactivateSchemaVersion: ReturnType<typeof vi.fn>;
  };
  let staticFileApi: {
    listFiles: ReturnType<typeof vi.fn>;
    uploadFile: ReturnType<typeof vi.fn>;
    renameFile: ReturnType<typeof vi.fn>;
    deleteFile: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    folderApi = {
      listFolders: vi
        .fn()
        .mockResolvedValue([folder(ROOT_FOLDER_ID, "/"), folder("FLD-child", "/Child")]),
      getFolder: vi.fn()
    };
    contentApi = {
      listContents: vi.fn((folderId: string) =>
        Promise.resolve([content(folderId === ROOT_FOLDER_ID ? "RCD-root" : "RCD-child", folderId)])
      ),
      createContent: vi.fn(),
      replaceContent: vi.fn(),
      deleteContent: vi.fn()
    };
    contentTypeApi = {
      listSchemas: vi.fn().mockResolvedValue([{ name: "generic", version: "1.0", active: true }]),
      getLatestSchema: vi.fn(),
      getSchemaVersion: vi.fn().mockResolvedValue(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA),
      createSchema: vi.fn(),
      replaceSchemaVersion: vi.fn(),
      deactivateSchemaVersion: vi.fn()
    };
    staticFileApi = {
      listFiles: vi.fn((folderId: string) =>
        Promise.resolve([staticFile(folderId === ROOT_FOLDER_ID ? "STF-root" : "STF-child", folderId)])
      ),
      uploadFile: vi.fn(),
      renameFile: vi.fn(),
      deleteFile: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RouteHostComponent],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: FolderApiClient, useFactory: () => folderApi },
        { provide: ContentApiClient, useFactory: () => contentApi },
        { provide: ContentTypeApiClient, useFactory: () => contentTypeApi },
        { provide: StaticFileApiClient, useFactory: () => staticFileApi }
      ]
    }).compileComponents();
  });

  it("renders the default folder explorer route with the root folder", async () => {
    const fixture = await navigateTo("/folders");

    expect(pageText(fixture)).toContain("Folder Explorer");
    expect(pageText(fixture)).toContain("RCD-root");
    expect(pageText(fixture)).toContain("STF-root.pdf");
    expect(contentApi.listContents).toHaveBeenCalledWith(ROOT_FOLDER_ID);
    expect(staticFileApi.listFiles).toHaveBeenCalledWith(ROOT_FOLDER_ID);
  });

  it("binds the folder route parameter into selected folder requests", async () => {
    const fixture = await navigateTo("/folders/FLD-child");

    expect(pageText(fixture)).toContain("/Child");
    expect(pageText(fixture)).toContain("RCD-child");
    expect(pageText(fixture)).toContain("STF-child.pdf");
    expect(contentApi.listContents).toHaveBeenLastCalledWith("FLD-child");
    expect(staticFileApi.listFiles).toHaveBeenLastCalledWith("FLD-child");
  });

  it("renders the content type schema administration route", async () => {
    const fixture = await navigateTo("/content-types");

    expect(pageText(fixture)).toContain("Content Type Schemas");
    expect(pageText(fixture)).toContain("generic");
    expect(pageText(fixture)).toContain("title");
    expect(contentTypeApi.listSchemas).toHaveBeenCalled();
    expect(contentTypeApi.getSchemaVersion).toHaveBeenCalledWith("generic", "1.0");
  });

  async function navigateTo(path: string): Promise<ComponentFixture<RouteHostComponent>> {
    const fixture = TestBed.createComponent(RouteHostComponent);
    const router = TestBed.inject(Router);

    await router.navigateByUrl(path);
    await settle(fixture);

    return fixture;
  }
});

async function settle(fixture: ComponentFixture<RouteHostComponent>): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function pageText(fixture: ComponentFixture<RouteHostComponent>): string {
  return fixture.nativeElement.textContent ?? "";
}

function folder(folderId: Folder["folderId"], path: string): Folder {
  return {
    folderId,
    name: path === "/" ? "Root" : "Child",
    parentFolderId: folderId === ROOT_FOLDER_ID ? null : ROOT_FOLDER_ID,
    path,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}

function content(contentId: ContentRecord["contentId"], folderId: ContentRecord["folderId"]): ContentRecord {
  return {
    contentId,
    folderId,
    contentType: "generic",
    schemaVersion: "1.0",
    version: 1,
    status: "draft",
    data: {},
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}

function staticFile(fileId: StaticFile["fileId"], folderId: StaticFile["folderId"]): StaticFile {
  return {
    fileId,
    folderId,
    filename: `${fileId}.pdf`,
    mimeType: "application/pdf",
    size: 7,
    path: `stored/${fileId}`,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}
