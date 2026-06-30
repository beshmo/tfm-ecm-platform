import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  INITIAL_GENERIC_CONTENT_TYPE_SCHEMA,
  ROOT_FOLDER_ID,
  type ContentRecord,
  type Folder,
  type StaticFile
} from "@ecmp/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContentTypeApiClient } from "../../content-types/infrastructure/content-type-api.client";
import { ContentApiClient } from "../../content/infrastructure/content-api.client";
import { StaticFileApiClient } from "../../content/infrastructure/static-file-api.client";
import { FolderApiClient } from "../../folders/infrastructure/folder-api.client";
import { FolderExplorerPageComponent } from "./folder-explorer-page.component";

describe("folder explorer page integration", () => {
  let folders: Folder[];
  let contentsByFolder: Map<string, ContentRecord[]>;
  let filesByFolder: Map<string, StaticFile[]>;
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
  };
  let staticFileApi: {
    listFiles: ReturnType<typeof vi.fn>;
    uploadFile: ReturnType<typeof vi.fn>;
    renameFile: ReturnType<typeof vi.fn>;
    deleteFile: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    folders = [folder(ROOT_FOLDER_ID, "Root", "/"), folder("FLD-child", "Child", "/Child")];
    contentsByFolder = new Map([
      [ROOT_FOLDER_ID, [content("RCD-1", ROOT_FOLDER_ID, "Welcome")]],
      ["FLD-child", [content("RCD-2", "FLD-child", "Child draft")]]
    ]);
    filesByFolder = new Map([
      [ROOT_FOLDER_ID, [staticFile("STF-1", ROOT_FOLDER_ID, "manual.pdf")]],
      ["FLD-child", [staticFile("STF-2", "FLD-child", "child.png", "image/png")]]
    ]);
    folderApi = {
      listFolders: vi.fn().mockResolvedValue(folders),
      getFolder: vi.fn()
    };
    contentApi = {
      listContents: vi.fn((folderId: string) =>
        Promise.resolve(contentsByFolder.get(folderId) ?? [])
      ),
      createContent: vi.fn().mockResolvedValue(content("RCD-3", ROOT_FOLDER_ID, "Created")),
      replaceContent: vi.fn().mockResolvedValue(content("RCD-1", ROOT_FOLDER_ID, "Updated", 2)),
      deleteContent: vi.fn().mockResolvedValue(undefined)
    };
    contentTypeApi = {
      listSchemas: vi.fn().mockResolvedValue([{ name: "generic", version: "1.0", active: true }]),
      getLatestSchema: vi.fn().mockResolvedValue(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA),
      getSchemaVersion: vi.fn().mockResolvedValue(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA)
    };
    staticFileApi = {
      listFiles: vi.fn((folderId: string) => Promise.resolve(filesByFolder.get(folderId) ?? [])),
      uploadFile: vi.fn().mockResolvedValue(staticFile("STF-3", ROOT_FOLDER_ID, "uploaded.pdf")),
      renameFile: vi.fn().mockResolvedValue(staticFile("STF-1", ROOT_FOLDER_ID, "renamed.pdf")),
      deleteFile: vi.fn().mockResolvedValue(undefined)
    };
  });

  it("renders folders, selected folder content, static files, empty state, and request errors", async () => {
    const fixture = await renderExplorer();

    expect(pageText(fixture)).toContain("Folder Explorer");
    expect(pageText(fixture)).toContain("/");
    expect(pageText(fixture)).toContain("/Child");
    expect(pageText(fixture)).toContain("RCD-1");
    expect(pageText(fixture)).toContain("generic");
    expect(pageText(fixture)).toContain("manual.pdf");

    contentsByFolder.set("FLD-child", []);
    filesByFolder.set("FLD-child", []);
    await clickButton(fixture, "/Child");

    expect(pageText(fixture)).toContain("This folder has no content records or static files.");

    folderApi.listFolders.mockRejectedValueOnce({ message: "Folder request failed." });
    const errorFixture = TestBed.createComponent(FolderExplorerPageComponent);
    errorFixture.detectChanges();
    await settle(errorFixture);

    expect(pageText(errorFixture)).toContain("Folder request failed.");
  });

  it("shows loading feedback while initial management data is pending", async () => {
    let resolveFolders: (value: Folder[]) => void = () => undefined;
    folderApi.listFolders.mockReturnValueOnce(
      new Promise<Folder[]>((resolve) => {
        resolveFolders = resolve;
      })
    );

    const fixture = TestBed.createComponent(FolderExplorerPageComponent);
    fixture.detectChanges();

    expect(pageText(fixture)).toContain("Loading folders...");

    resolveFolders(folders);
    await settle(fixture);

    expect(pageText(fixture)).toContain("RCD-1");
  });

  it("selects a rendered folder and reloads content and files for that folder", async () => {
    const fixture = await renderExplorer();

    await clickButton(fixture, "/Child");

    expect(contentApi.listContents).toHaveBeenLastCalledWith("FLD-child");
    expect(staticFileApi.listFiles).toHaveBeenLastCalledWith("FLD-child");
    expect(pageText(fixture)).toContain("RCD-2");
    expect(pageText(fixture)).toContain("child.png");
  });

  it("creates content through rendered schema controls and preserves validation failures", async () => {
    const fixture = await renderExplorer();

    await clickButton(fixture, "New content");
    expect(contentTypeApi.listSchemas).toHaveBeenCalled();
    await fixture.componentInstance.openCreate();
    await settle(fixture);
    await setInputValue(fixture, "title", "Created");
    await setInputValue(fixture, "priority", "3");
    await submitForm(fixture);

    expect(contentApi.createContent).toHaveBeenCalledWith({
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: { title: "Created", priority: 3 }
    });
    expect(contentApi.listContents).toHaveBeenLastCalledWith(ROOT_FOLDER_ID);

    contentApi.createContent.mockRejectedValueOnce({
      status: 400,
      message: "Content data is invalid.",
      validationMessages: ["title must be a string."]
    });
    await clickButton(fixture, "New content");
    await fixture.componentInstance.openCreate();
    await settle(fixture);
    await setInputValue(fixture, "priority", "5");
    await submitForm(fixture);

    expect(pageText(fixture)).toContain("Please complete required fields.");
    expect(pageText(fixture)).toContain("title is required.");
    expect(contentApi.createContent).toHaveBeenCalledTimes(1);

    await setInputValue(fixture, "title", "Still here");
    await submitForm(fixture);

    expect(pageText(fixture)).toContain("Content data is invalid.");
    expect(pageText(fixture)).toContain("title must be a string.");
    expect(input(fixture, "title").value).toBe("Still here");
  });

  it("edits and deletes content through rendered controls", async () => {
    const fixture = await renderExplorer();

    await clickButton(fixture, "Edit");
    await fixture.componentInstance.openEdit(contentsByFolder.get(ROOT_FOLDER_ID)![0]!);
    await settle(fixture);
    await setInputValue(fixture, "title", "Updated");
    await submitForm(fixture);

    expect(contentTypeApi.getSchemaVersion).toHaveBeenCalledWith("generic", "1.0");
    expect(contentApi.replaceContent).toHaveBeenCalledWith("RCD-1", {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: { title: "Updated" }
    });

    vi.stubGlobal("confirm", vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true));
    await clickButton(fixture, "Delete");

    expect(contentApi.deleteContent).not.toHaveBeenCalled();

    contentApi.deleteContent.mockRejectedValueOnce({
      status: 404,
      message: "Content record was not found."
    });
    await clickButton(fixture, "Delete");

    expect(contentApi.deleteContent).toHaveBeenCalledWith("RCD-1");
    expect(contentApi.listContents).toHaveBeenLastCalledWith(ROOT_FOLDER_ID);
    expect(pageText(fixture)).toContain("Content record was not found.");
    vi.unstubAllGlobals();
  });

  it("uploads, renames, and deletes static files through rendered controls", async () => {
    const fixture = await renderExplorer();

    await clickButton(fixture, "Upload file");

    expect(pageText(fixture)).toContain("Choose a file to upload.");
    expect(staticFileApi.uploadFile).not.toHaveBeenCalled();

    const upload = fixture.nativeElement.querySelector(
      'input[name="staticFile"]'
    ) as HTMLInputElement;
    const file = new File(["content"], "uploaded.pdf", { type: "application/pdf" });
    Object.defineProperty(upload, "files", { configurable: true, value: [file] });
    upload.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    await clickButton(fixture, "Upload file");

    expect(staticFileApi.uploadFile).toHaveBeenCalledWith(ROOT_FOLDER_ID, file);
    expect(staticFileApi.listFiles).toHaveBeenLastCalledWith(ROOT_FOLDER_ID);

    vi.stubGlobal("prompt", vi.fn().mockReturnValueOnce(null).mockReturnValueOnce("renamed.pdf"));
    await clickButton(fixture, "Rename");

    expect(staticFileApi.renameFile).not.toHaveBeenCalled();

    staticFileApi.renameFile.mockRejectedValueOnce({ message: "Filename is invalid." });
    await clickButton(fixture, "Rename");

    expect(staticFileApi.renameFile).toHaveBeenCalledWith("STF-1", { filename: "renamed.pdf" });
    expect(pageText(fixture)).toContain("Filename is invalid.");
    vi.unstubAllGlobals();

    vi.stubGlobal("confirm", vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true));
    await clickButton(fixture, "Delete", 1);

    expect(staticFileApi.deleteFile).not.toHaveBeenCalled();

    staticFileApi.deleteFile.mockRejectedValueOnce({
      status: 404,
      message: "Static file was not found."
    });
    await clickButton(fixture, "Delete", 1);

    expect(staticFileApi.deleteFile).toHaveBeenCalledWith("STF-1");
    expect(staticFileApi.listFiles).toHaveBeenLastCalledWith(ROOT_FOLDER_ID);
    expect(pageText(fixture)).toContain("Static file was not found.");
    vi.unstubAllGlobals();
  });

  async function renderExplorer(): Promise<ComponentFixture<FolderExplorerPageComponent>> {
    const fixture = TestBed.createComponent(FolderExplorerPageComponent);
    fixture.detectChanges();
    await settle(fixture);

    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderExplorerPageComponent],
      providers: [
        { provide: FolderApiClient, useFactory: () => folderApi },
        { provide: ContentApiClient, useFactory: () => contentApi },
        { provide: ContentTypeApiClient, useFactory: () => contentTypeApi },
        { provide: StaticFileApiClient, useFactory: () => staticFileApi }
      ]
    }).compileComponents();
  });
});

async function clickButton(
  fixture: ComponentFixture<FolderExplorerPageComponent>,
  label: string,
  index = 0
): Promise<void> {
  const button = buttons(fixture).filter((item) => item.textContent?.trim() === label)[index];

  expect(button, `button "${label}"`).toBeTruthy();
  button.click();
  await settle(fixture);
}

async function setInputValue(
  fixture: ComponentFixture<FolderExplorerPageComponent>,
  name: string,
  value: string
): Promise<void> {
  const control = input(fixture, name);

  control.value = value;
  control.dispatchEvent(new Event("input"));
  await settle(fixture);
}

async function submitForm(fixture: ComponentFixture<FolderExplorerPageComponent>): Promise<void> {
  const form = fixture.nativeElement.querySelector("form") as HTMLFormElement | null;

  expect(form).toBeTruthy();
  form!.dispatchEvent(new Event("submit"));
  await settle(fixture);
}

async function settle(fixture: ComponentFixture<FolderExplorerPageComponent>): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
  fixture.detectChanges();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await fixture.whenStable();
  fixture.detectChanges();
}

function input(
  fixture: ComponentFixture<FolderExplorerPageComponent>,
  name: string
): HTMLInputElement {
  const control =
    (Array.from(fixture.nativeElement.querySelectorAll("input")) as HTMLInputElement[]).find(
      (item) => item.name === name
    ) ??
    (Array.from(fixture.nativeElement.querySelectorAll("label")) as HTMLLabelElement[])
      .find((label) => label.textContent?.trim().startsWith(name))
      ?.querySelector("input") ??
    null;

  if (!control) {
    throw new Error(`Missing input "${name}". DOM: ${fixture.nativeElement.innerHTML}`);
  }

  return control;
}

function buttons(fixture: ComponentFixture<FolderExplorerPageComponent>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll("button"));
}

function pageText(fixture: ComponentFixture<FolderExplorerPageComponent>): string {
  return fixture.nativeElement.textContent ?? "";
}

function folder(folderId: Folder["folderId"], name: string, path: string): Folder {
  return {
    folderId,
    name,
    parentFolderId: folderId === ROOT_FOLDER_ID ? null : ROOT_FOLDER_ID,
    path,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}

function content(
  contentId: ContentRecord["contentId"],
  folderId: ContentRecord["folderId"],
  title: string,
  version = 1
): ContentRecord {
  return {
    contentId,
    folderId,
    contentType: "generic",
    schemaVersion: "1.0",
    version,
    status: "draft",
    data: { title },
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}

function staticFile(
  fileId: StaticFile["fileId"],
  folderId: StaticFile["folderId"],
  filename: string,
  mimeType = "application/pdf"
): StaticFile {
  return {
    fileId,
    folderId,
    filename,
    mimeType,
    size: 7,
    path: `stored/${fileId}`,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}
