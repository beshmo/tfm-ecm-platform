import {
  INITIAL_GENERIC_CONTENT_TYPE_SCHEMA,
  ROOT_FOLDER_ID,
  type ContentRecord,
  type Folder,
  type StaticFile
} from "@ecmp/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FolderExplorerPageComponent } from "./folder-explorer-page.component";

describe("folder explorer page component", () => {
  let folders: Folder[];
  let contents: ContentRecord[];
  let files: StaticFile[];
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
    folders = [
      folder(ROOT_FOLDER_ID, "Root", "/"),
      folder("FLD-child", "Child", "/Child")
    ];
    contents = [content("RCD-1", "Welcome")];
    files = [staticFile("STF-1", "manual.pdf")];
    folderApi = {
      listFolders: vi.fn().mockResolvedValue(folders),
      getFolder: vi.fn()
    };
    contentApi = {
      listContents: vi.fn().mockResolvedValue(contents),
      createContent: vi.fn().mockResolvedValue(content("RCD-2", "Created")),
      replaceContent: vi.fn().mockResolvedValue(content("RCD-1", "Updated", 2)),
      deleteContent: vi.fn().mockResolvedValue(undefined)
    };
    contentTypeApi = {
      listSchemas: vi.fn().mockResolvedValue([{ name: "generic", version: "1.0", active: true }]),
      getLatestSchema: vi.fn().mockResolvedValue(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA),
      getSchemaVersion: vi.fn().mockResolvedValue(INITIAL_GENERIC_CONTENT_TYPE_SCHEMA)
    };
    staticFileApi = {
      listFiles: vi.fn().mockResolvedValue(files),
      uploadFile: vi.fn().mockResolvedValue(staticFile("STF-2", "uploaded.pdf")),
      renameFile: vi.fn().mockResolvedValue(staticFile("STF-1", "renamed.pdf")),
      deleteFile: vi.fn().mockResolvedValue(undefined)
    };
  });

  it("loads folders and selected folder content and files on initialization", async () => {
    const component = createComponent();

    await component.loadWorkspace(ROOT_FOLDER_ID);

    expect(component.folders).toEqual(folders);
    expect(component.contents).toEqual(contents);
    expect(component.files).toEqual(files);
    expect(component.selectedFolderId).toBe(ROOT_FOLDER_ID);
    expect(contentApi.listContents).toHaveBeenCalledWith(ROOT_FOLDER_ID);
    expect(staticFileApi.listFiles).toHaveBeenCalledWith(ROOT_FOLDER_ID);
  });

  it("loads content and files when a folder is selected", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);

    await component.selectFolder("FLD-child");

    expect(component.selectedFolder?.path).toBe("/Child");
    expect(contentApi.listContents).toHaveBeenLastCalledWith("FLD-child");
    expect(staticFileApi.listFiles).toHaveBeenLastCalledWith("FLD-child");
  });

  it("creates content from schema-driven form data and refreshes the list", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);
    await component.openCreate();

    component.formData["title"] = "Created";
    component.formData["priority"] = 3;
    await component.submitEditor();

    expect(contentTypeApi.listSchemas).toHaveBeenCalled();
    expect(contentTypeApi.getLatestSchema).toHaveBeenCalledWith("generic");
    expect(contentApi.createContent).toHaveBeenCalledWith({
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: { title: "Created", priority: 3 }
    });
    expect(component.editorOpen).toBe(false);
  });

  it("edits content with the stored schema version and refreshes the list", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);
    await component.openEdit(contents[0] as ContentRecord);

    component.formData["title"] = "Updated";
    await component.submitEditor();

    expect(contentTypeApi.getSchemaVersion).toHaveBeenCalledWith("generic", "1.0");
    expect(contentApi.replaceContent).toHaveBeenCalledWith("RCD-1", {
      folderId: ROOT_FOLDER_ID,
      contentType: "generic",
      schemaVersion: "1.0",
      data: { title: "Updated" }
    });
  });

  it("deletes content after confirmation", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    await component.confirmDelete(contents[0] as ContentRecord);

    expect(contentApi.deleteContent).toHaveBeenCalledWith("RCD-1");
    expect(component.contents).toEqual([]);
    vi.unstubAllGlobals();
  });

  it("uploads a selected file and refreshes the selected folder", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);
    const file = new File(["content"], "uploaded.pdf", { type: "application/pdf" });

    component.selectedUploadFile = file;
    await component.uploadSelectedFile();

    expect(staticFileApi.uploadFile).toHaveBeenCalledWith(ROOT_FOLDER_ID, file);
    expect(staticFileApi.listFiles).toHaveBeenLastCalledWith(ROOT_FOLDER_ID);
    expect(component.selectedUploadFile).toBeNull();
  });

  it("shows an upload error when no file is selected", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);

    await component.uploadSelectedFile();

    expect(staticFileApi.uploadFile).not.toHaveBeenCalled();
    expect(component.fileErrorMessage).toBe("Choose a file to upload.");
  });

  it("renames a static file and refreshes the selected folder", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);
    vi.stubGlobal("prompt", vi.fn().mockReturnValue("renamed.pdf"));

    await component.renameFile(files[0] as StaticFile);

    expect(staticFileApi.renameFile).toHaveBeenCalledWith("STF-1", { filename: "renamed.pdf" });
    expect(staticFileApi.listFiles).toHaveBeenLastCalledWith(ROOT_FOLDER_ID);
    vi.unstubAllGlobals();
  });

  it("deletes a static file after confirmation", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    await component.confirmDeleteFile(files[0] as StaticFile);

    expect(staticFileApi.deleteFile).toHaveBeenCalledWith("STF-1");
    expect(component.files).toEqual([]);
    vi.unstubAllGlobals();
  });

  it("keeps file workflow errors visible when upload fails", async () => {
    const component = createComponent();
    staticFileApi.uploadFile.mockRejectedValueOnce({
      status: 415,
      message: "Static file MIME type is not supported."
    });
    await component.loadWorkspace(ROOT_FOLDER_ID);

    component.selectedUploadFile = new File(["content"], "app.exe");
    await component.uploadSelectedFile();

    expect(component.fileErrorMessage).toBe("Static file MIME type is not supported.");
  });

  it("keeps form data visible when backend validation fails", async () => {
    const component = createComponent();
    contentApi.createContent.mockRejectedValueOnce({
      status: 400,
      message: "Content data is invalid.",
      validationMessages: ["title must be a string."]
    });
    await component.loadWorkspace(ROOT_FOLDER_ID);
    await component.openCreate();

    component.formData["title"] = "Still here";
    await component.submitEditor();

    expect(component.editorOpen).toBe(true);
    expect(component.formData["title"]).toBe("Still here");
    expect(component.formErrorMessage).toBe("Content data is invalid.");
    expect(component.validationMessages).toEqual(["title must be a string."]);
  });

  it("does not delete content when confirmation is cancelled", async () => {
    const component = createComponent();
    await component.loadWorkspace(ROOT_FOLDER_ID);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    await component.confirmDelete(contents[0] as ContentRecord);

    expect(contentApi.deleteContent).not.toHaveBeenCalled();
    expect(component.contents).toEqual(contents);
    vi.unstubAllGlobals();
  });

  function createComponent(): FolderExplorerPageComponent {
    return new FolderExplorerPageComponent(
      folderApi as never,
      contentApi as never,
      contentTypeApi as never,
      staticFileApi as never
    );
  }
});

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

function content(contentId: ContentRecord["contentId"], title: string, version = 1): ContentRecord {
  return {
    contentId,
    folderId: ROOT_FOLDER_ID,
    contentType: "generic",
    schemaVersion: "1.0",
    version,
    status: "draft",
    data: { title },
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}

function staticFile(fileId: StaticFile["fileId"], filename: string): StaticFile {
  return {
    fileId,
    folderId: ROOT_FOLDER_ID,
    filename,
    mimeType: "application/pdf",
    size: 7,
    path: `stored/${fileId}`,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}
