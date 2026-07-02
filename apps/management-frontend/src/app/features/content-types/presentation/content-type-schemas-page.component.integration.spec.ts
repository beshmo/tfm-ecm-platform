import { ComponentFixture, TestBed } from "@angular/core/testing";
import type {
  ContentTypeDefinition,
  ContentTypeSchemaDefinition,
  ContentTypeSchemaSummary,
  Folder
} from "@ecmp/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContentTypeApiClient } from "../infrastructure/content-type-api.client";
import { ContentTypeSchemasPageComponent } from "./content-type-schemas-page.component";

const SCHEMAS_FOLDER_ID = "FLD-system-schemas";
const NEWS_FOLDER_ID = "FLD-news";

describe("content type schemas page integration", () => {
  let summaries: ContentTypeSchemaSummary[];
  let definitions: Map<string, ContentTypeSchemaDefinition>;
  let rootFolder: Folder;
  let schemaSubfolders: Folder[];
  let folderDefinitions: ContentTypeDefinition[];
  let contentTypeApi: {
    listSchemas: ReturnType<typeof vi.fn>;
    getLatestSchema: ReturnType<typeof vi.fn>;
    getSchemaVersion: ReturnType<typeof vi.fn>;
    createSchema: ReturnType<typeof vi.fn>;
    replaceSchemaVersion: ReturnType<typeof vi.fn>;
    deactivateSchemaVersion: ReturnType<typeof vi.fn>;
    getSchemaFolder: ReturnType<typeof vi.fn>;
    listSchemaSubfolders: ReturnType<typeof vi.fn>;
    createSchemaFolder: ReturnType<typeof vi.fn>;
    listContentTypeDefinitions: ReturnType<typeof vi.fn>;
    moveContentTypeDefinition: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    summaries = [{ name: "generic", version: "1.0", active: true }];
    definitions = new Map([[schemaKey("generic", "1.0"), schema("generic", "1.0")]]);
    rootFolder = folder(SCHEMAS_FOLDER_ID, "schemas", "/system/schemas", "FLD-system");
    schemaSubfolders = [folder(NEWS_FOLDER_ID, "news", "/system/schemas/news", SCHEMAS_FOLDER_ID)];
    folderDefinitions = [definition("generic", SCHEMAS_FOLDER_ID)];
    contentTypeApi = {
      listSchemas: vi.fn(() => Promise.resolve([...summaries])),
      getLatestSchema: vi.fn(),
      getSchemaVersion: vi.fn((name: string, version: string) =>
        Promise.resolve(definitions.get(schemaKey(name, version)))
      ),
      createSchema: vi.fn((source: string) => {
        const definition = source.includes("name: article")
          ? schema("article", "1.0", "headline")
          : schema("generic", "1.0");

        upsertSchema(definition);
        return Promise.resolve(definition);
      }),
      replaceSchemaVersion: vi.fn((name: string, version: string, source: string) => {
        const definition = schema(
          name,
          version,
          source.includes("headline") ? "headline" : "title"
        );

        upsertSchema(definition);
        return Promise.resolve(definition);
      }),
      deactivateSchemaVersion: vi.fn((name: string, version: string) => {
        summaries = summaries.filter(
          (summary) => summary.name !== name || summary.version !== version
        );
        return Promise.resolve();
      }),
      getSchemaFolder: vi.fn(() => Promise.resolve(rootFolder)),
      listSchemaSubfolders: vi.fn(() => Promise.resolve([...schemaSubfolders])),
      createSchemaFolder: vi.fn((name: string) =>
        Promise.resolve(
          folder(`FLD-${name}`, name, `/system/schemas/${name}`, SCHEMAS_FOLDER_ID)
        )
      ),
      listContentTypeDefinitions: vi.fn(() => Promise.resolve([...folderDefinitions])),
      moveContentTypeDefinition: vi.fn((name: string, targetFolderId: string) =>
        Promise.resolve(definition(name, targetFolderId))
      )
    };

    await TestBed.configureTestingModule({
      imports: [ContentTypeSchemasPageComponent],
      providers: [{ provide: ContentTypeApiClient, useFactory: () => contentTypeApi }]
    }).compileComponents();
  });

  it("renders the page shell and loads root folder", async () => {
    const fixture = await renderPage();

    expect(pageText(fixture)).toContain("Content Type Schemas");
    expect(contentTypeApi.getSchemaFolder).toHaveBeenCalledWith(SCHEMAS_FOLDER_ID);
    expect(contentTypeApi.listContentTypeDefinitions).toHaveBeenCalledWith(SCHEMAS_FOLDER_ID);
  });

  it("loads and displays definitions for the current folder", async () => {
    const fixture = await renderPage();

    expect(pageText(fixture)).toContain("generic");
    expect(contentTypeApi.listContentTypeDefinitions).toHaveBeenCalledTimes(1);
  });

  it("selects a definition and shows its schema details", async () => {
    const fixture = await renderPage();

    clickDefinition(fixture, "generic");
    await settle(fixture);

    expect(contentTypeApi.getSchemaVersion).toHaveBeenCalledWith("generic", "1.0");
    expect(pageText(fixture)).toContain("title");
  });

  it("shows toolbar buttons that are disabled when no definition is selected", async () => {
    const fixture = await renderPage();

    expect(getButton(fixture, "New")).toBeDefined();
    expect(getButton(fixture, "Edit")).toBeDefined();
    expect(getButton(fixture, "Move")).toBeDefined();
    expect(getButton(fixture, "Deactivate")).toBeDefined();
    expect(getButton(fixture, "Edit").disabled).toBe(true);
    expect(getButton(fixture, "Move").disabled).toBe(true);
    expect(getButton(fixture, "Deactivate").disabled).toBe(true);
  });

  it("opens the editor modal on New and closes on Cancel", async () => {
    const fixture = await renderPage();

    clickButton(fixture, "New");
    await settle(fixture);

    expect(fixture.nativeElement.querySelector(".modal-panel")).toBeTruthy();

    clickButton(fixture, "Cancel");
    await settle(fixture);

    expect(fixture.nativeElement.querySelector(".modal-panel")).toBeFalsy();
  });

  it("creates a schema from the editor modal and refreshes the definition list", async () => {
    const fixture = await renderPage();

    clickButton(fixture, "New");
    await settle(fixture);

    setInputValue(fixture, "fieldName-0", "headline");
    clickButton(fixture, "Save");
    await settle(fixture);

    expect(contentTypeApi.createSchema).toHaveBeenCalledWith(
      expect.stringContaining("- name: headline"),
      SCHEMAS_FOLDER_ID
    );
    expect(contentTypeApi.listContentTypeDefinitions).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.querySelector(".modal-panel")).toBeFalsy();
  });

  it("opens the editor modal on Edit with pre-populated fields", async () => {
    const fixture = await renderPage();

    clickDefinition(fixture, "generic");
    await settle(fixture);

    clickButton(fixture, "Edit");
    await settle(fixture);

    expect(inputValue(fixture, "fieldName-0")).toBe("title");
    expect(inputValue(fixture, "fieldType-0")).toBe("string");
  });

  it("replaces a schema from the editor modal in edit mode", async () => {
    const fixture = await renderPage();

    clickDefinition(fixture, "generic");
    await settle(fixture);

    clickButton(fixture, "Edit");
    await settle(fixture);

    setInputValue(fixture, "fieldName-0", "headline");
    clickButton(fixture, "Save");
    await settle(fixture);

    expect(contentTypeApi.replaceSchemaVersion).toHaveBeenCalledWith(
      "generic",
      "1.0",
      expect.stringContaining("headline")
    );
  });

  it("moves a definition to another folder via the folder picker", async () => {
    const fixture = await renderPage();

    clickDefinition(fixture, "generic");
    await settle(fixture);

    clickButton(fixture, "Move");
    await settle(fixture);

    expect(fixture.nativeElement.querySelector(".modal-panel")).toBeTruthy();
    expect(pageText(fixture)).toContain("Move to folder");
    expect(pageText(fixture)).toContain("/system/schemas/news");

    clickButton(fixture, "/system/schemas/news");
    await settle(fixture);

    expect(contentTypeApi.moveContentTypeDefinition).toHaveBeenCalledWith("generic", NEWS_FOLDER_ID);
  });

  it("deactivates a schema after confirmation and refreshes", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const fixture = await renderPage();

    clickDefinition(fixture, "generic");
    await settle(fixture);

    clickButton(fixture, "Deactivate");
    await settle(fixture);

    expect(contentTypeApi.deactivateSchemaVersion).toHaveBeenCalledWith("generic", "1.0");
    vi.unstubAllGlobals();
  });

  it("cancels schema deactivation without sending a request", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const fixture = await renderPage();

    clickDefinition(fixture, "generic");
    await settle(fixture);

    clickButton(fixture, "Deactivate");
    await settle(fixture);

    expect(contentTypeApi.deactivateSchemaVersion).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  async function renderPage(): Promise<ComponentFixture<ContentTypeSchemasPageComponent>> {
    const fixture = TestBed.createComponent(ContentTypeSchemasPageComponent);

    await settle(fixture);
    return fixture;
  }

  function upsertSchema(definition: ContentTypeSchemaDefinition): void {
    definitions.set(schemaKey(definition.name, definition.version), definition);

    if (
      !summaries.some(
        (summary) => summary.name === definition.name && summary.version === definition.version
      )
    ) {
      summaries = [
        ...summaries,
        { name: definition.name, version: definition.version, active: true }
      ];
    }
  }
});

async function settle(fixture: ComponentFixture<ContentTypeSchemasPageComponent>): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function pageText(fixture: ComponentFixture<ContentTypeSchemasPageComponent>): string {
  return fixture.nativeElement.textContent ?? "";
}

function getButton(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  text: string
): HTMLButtonElement | undefined {
  return Array.from(fixture.nativeElement.querySelectorAll("button")).find(
    (candidate) => (candidate as HTMLButtonElement).textContent?.trim() === text
  ) as HTMLButtonElement | undefined;
}

function clickButton(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  text: string
): void {
  const button = getButton(fixture, text);

  if (!button) {
    throw new Error(`Button "${text}" was not found.`);
  }

  button.click();
}

function clickDefinition(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): void {
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll(".schema-button")
  ) as HTMLButtonElement[];
  const button = buttons.find((b) => {
    const strong = b.querySelector("strong");

    return strong && strong.textContent?.trim() === name;
  });

  if (!button) {
    throw new Error(`Definition "${name}" was not found.`);
  }

  button.click();
}

function input(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): HTMLInputElement | HTMLSelectElement {
  const element = fixture.nativeElement.querySelector(
    `input[name="${name}"], input[data-name="${name}"], select[name="${name}"], select[data-name="${name}"]`
  ) as HTMLInputElement | HTMLSelectElement | null;

  if (!element) {
    throw new Error(`Input "${name}" was not found.`);
  }

  return element;
}

function inputValue(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): string {
  return (input(fixture, name) as HTMLInputElement).value;
}

function setInputValue(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string,
  value: string
): void {
  const element = input(fixture, name) as HTMLInputElement;

  element.value = value;
  element.dispatchEvent(new Event("input"));
  fixture.detectChanges();
}

function schemaKey(name: string, version: string): string {
  return `${name}:${version}`;
}

function schema(
  name: string,
  version: string,
  fieldName = "title"
): ContentTypeSchemaDefinition {
  return {
    name,
    version,
    fields: [{ name: fieldName, type: "string", required: true }]
  };
}

function folder(
  folderId: string,
  name: string,
  path: string,
  parentFolderId: string
): Folder {
  return {
    folderId: folderId as Folder["folderId"],
    name,
    parentFolderId: parentFolderId as Folder["parentFolderId"],
    path,
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}

function definition(name: string, folderId: string): ContentTypeDefinition {
  return {
    contentTypeDefinitionId: `CTD-${name}` as ContentTypeDefinition["contentTypeDefinitionId"],
    objectTypeId: "ecmp:content-type-definition",
    folderId: folderId as ContentTypeDefinition["folderId"],
    name,
    versions: [{ name, version: "1.0", active: true }],
    createdAt: "2026-06-29T10:00:00.000Z",
    updatedAt: "2026-06-29T10:00:00.000Z"
  };
}
