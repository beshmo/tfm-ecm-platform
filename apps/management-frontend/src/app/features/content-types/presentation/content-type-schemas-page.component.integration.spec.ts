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

describe("content type schemas page integration", () => {
  let summaries: ContentTypeSchemaSummary[];
  let definitions: Map<string, ContentTypeSchemaDefinition>;
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
    schemaSubfolders = [folder("FLD-news", "news", "/system/schemas/news", SCHEMAS_FOLDER_ID)];
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
      getSchemaFolder: vi.fn(() =>
        Promise.resolve(folder(SCHEMAS_FOLDER_ID, "schemas", "/system/schemas", "FLD-system"))
      ),
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

  it("renders active schema summaries and selected normalized schema details", async () => {
    const fixture = await renderPage();

    expect(pageText(fixture)).toContain("Content Type Schemas");
    expect(pageText(fixture)).toContain("generic");
    expect(pageText(fixture)).toContain("1.0");
    expect(pageText(fixture)).toContain("title");
    expect(contentTypeApi.listSchemas).toHaveBeenCalled();
    expect(contentTypeApi.getSchemaVersion).toHaveBeenCalledWith("generic", "1.0");
  });

  it("initializes the replace form from the selected schema fields in order", async () => {
    definitions.set(schemaKey("generic", "1.0"), schemaWithFields("generic", "1.0", ["alpha", "beta"]));
    const fixture = await renderPage();

    expect(inputValue(fixture, "replaceFieldName-0")).toBe("alpha");
    expect(inputValue(fixture, "replaceFieldName-1")).toBe("beta");
  });

  it("creates a schema from the structured form and displays the returned normalized schema", async () => {
    const fixture = await renderPage();

    setInputValue(fixture, "createSchemaName", "article");
    setInputValue(fixture, "createFieldName-0", "headline");
    clickButton(fixture, "Create schema");
    await settle(fixture);

    expect(contentTypeApi.createSchema).toHaveBeenCalledWith(
      expect.stringContaining("- name: headline"),
      SCHEMAS_FOLDER_ID
    );
    expect(contentTypeApi.createSchema).toHaveBeenCalledWith(
      expect.stringContaining("name: article"),
      SCHEMAS_FOLDER_ID
    );
    expect(pageText(fixture)).toContain("article");
    expect(pageText(fixture)).toContain("headline");
  });

  it("adds an optional field and reorders it before generating create YAML", async () => {
    const fixture = await renderPage();

    setInputValue(fixture, "createSchemaName", "article");
    clickFormButton(fixture, "Create schema", "Add field");
    await settle(fixture);

    setInputValue(fixture, "createFieldName-1", "priority");
    setSelectValue(fixture, "createFieldType-1", "integer");
    clickFieldRowButton(fixture, "Create schema", 1, "Move field up");
    await settle(fixture);

    clickButton(fixture, "Create schema");
    await settle(fixture);

    const generatedYaml = contentTypeApi.createSchema.mock.calls[0]?.[0] as string;

    expect(generatedYaml.indexOf("name: priority")).toBeLessThan(generatedYaml.indexOf("name: title"));
    expect(generatedYaml).toContain("- name: priority\n    type: integer\n    required: false");
  });

  it("includes a selected extended field type in the generated create YAML", async () => {
    const fixture = await renderPage();

    setInputValue(fixture, "createSchemaName", "article");
    setInputValue(fixture, "createFieldName-0", "featured");
    setSelectValue(fixture, "createFieldType-0", "boolean");
    clickButton(fixture, "Create schema");
    await settle(fixture);

    const generatedYaml = contentTypeApi.createSchema.mock.calls[0]?.[0] as string;

    expect(generatedYaml).toContain("- name: featured\n    type: boolean\n    required: true");
  });

  it("preserves an existing extended field type through the replacement draft", async () => {
    definitions.set(schemaKey("generic", "1.0"), {
      name: "generic",
      version: "1.0",
      fields: [{ name: "publishMoment", type: "datetime", required: false }]
    });
    const fixture = await renderPage();

    expect(selectValue(fixture, "replaceFieldType-0")).toBe("datetime");

    clickButton(fixture, "Replace schema");
    await settle(fixture);

    expect(contentTypeApi.replaceSchemaVersion).toHaveBeenCalledWith(
      "generic",
      "1.0",
      expect.stringContaining("type: datetime")
    );
  });

  it("preserves the create draft and shows backend validation feedback", async () => {
    contentTypeApi.createSchema.mockRejectedValueOnce({
      status: 400,
      message: "Content type schema is invalid.",
      validationMessages: ["Schema source must be valid YAML."]
    });
    const fixture = await renderPage();

    setInputValue(fixture, "createFieldName-0", "headline");
    clickButton(fixture, "Create schema");
    await settle(fixture);

    expect(pageText(fixture)).toContain("Content type schema is invalid.");
    expect(pageText(fixture)).toContain("Schema source must be valid YAML.");
    expect(inputValue(fixture, "createFieldName-0")).toBe("headline");
  });

  it("shows an oversized create failure and preserves the create draft", async () => {
    contentTypeApi.createSchema.mockRejectedValueOnce({
      status: 413,
      message: "Content type schema source exceeds the maximum allowed size.",
      validationMessages: []
    });
    const fixture = await renderPage();

    setInputValue(fixture, "createFieldName-0", "headline");
    clickButton(fixture, "Create schema");
    await settle(fixture);

    expect(pageText(fixture)).toContain(
      "Content type schema source exceeds the maximum allowed size."
    );
    expect(inputValue(fixture, "createFieldName-0")).toBe("headline");
  });

  it("replaces the selected schema from the structured form and displays the replacement fields", async () => {
    const fixture = await renderPage();

    setInputValue(fixture, "replaceFieldName-0", "headline");
    clickButton(fixture, "Replace schema");
    await settle(fixture);

    expect(contentTypeApi.replaceSchemaVersion).toHaveBeenCalledWith(
      "generic",
      "1.0",
      expect.stringContaining("headline")
    );
    expect(pageText(fixture)).toContain("headline");
  });

  it("preserves the replace draft and shows backend conflict feedback", async () => {
    contentTypeApi.replaceSchemaVersion.mockRejectedValueOnce({
      status: 409,
      message: "Content type schema name or version does not match.",
      validationMessages: []
    });
    const fixture = await renderPage();

    setInputValue(fixture, "replaceFieldName-0", "headline");
    clickButton(fixture, "Replace schema");
    await settle(fixture);

    expect(pageText(fixture)).toContain("Content type schema name or version does not match.");
    expect(inputValue(fixture, "replaceFieldName-0")).toBe("headline");
  });

  it("deactivates a schema after confirmation and refreshes the active list", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const fixture = await renderPage();

    clickButton(fixture, "Deactivate");
    await settle(fixture);

    expect(contentTypeApi.deactivateSchemaVersion).toHaveBeenCalledWith("generic", "1.0");
    expect(pageText(fixture)).toContain("No active schema versions.");
    vi.unstubAllGlobals();
  });

  it("cancels schema deactivation without sending a request", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const fixture = await renderPage();

    clickButton(fixture, "Deactivate");
    await settle(fixture);

    expect(contentTypeApi.deactivateSchemaVersion).not.toHaveBeenCalled();
    expect(pageText(fixture)).toContain("generic");
    vi.unstubAllGlobals();
  });

  it("shows deactivate not-found feedback and refreshes the schema list", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    contentTypeApi.deactivateSchemaVersion.mockRejectedValueOnce({
      status: 404,
      message: "Content type schema 'generic' version '1.0' was not found.",
      validationMessages: []
    });
    const fixture = await renderPage();

    clickButton(fixture, "Deactivate");
    await settle(fixture);

    expect(pageText(fixture)).toContain(
      "Content type schema 'generic' version '1.0' was not found."
    );
    expect(contentTypeApi.listSchemas).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("loads the /system/schemas folder context with subfolders and definitions", async () => {
    const fixture = await renderPage();

    expect(contentTypeApi.getSchemaFolder).toHaveBeenCalledWith(SCHEMAS_FOLDER_ID);
    expect(contentTypeApi.listSchemaSubfolders).toHaveBeenCalledWith(SCHEMAS_FOLDER_ID);
    expect(contentTypeApi.listContentTypeDefinitions).toHaveBeenCalledWith(SCHEMAS_FOLDER_ID);
    expect(pageText(fixture)).toContain("Schema Folders");
    expect(pageText(fixture)).toContain("news");
  });

  it("navigates into a schema subfolder and reloads its context", async () => {
    const fixture = await renderPage();

    clickAriaButton(fixture, "Open news");
    await settle(fixture);

    expect(contentTypeApi.listSchemaSubfolders).toHaveBeenLastCalledWith("FLD-news");
    expect(contentTypeApi.listContentTypeDefinitions).toHaveBeenLastCalledWith("FLD-news");
  });

  it("creates a schema folder under the current schema folder", async () => {
    const fixture = await renderPage();

    setInputValue(fixture, "newSchemaFolderName", "archive");
    clickButton(fixture, "Create folder");
    await settle(fixture);

    expect(contentTypeApi.createSchemaFolder).toHaveBeenCalledWith("archive", SCHEMAS_FOLDER_ID);
  });

  it("moves a content type definition to the selected target folder", async () => {
    const fixture = await renderPage();

    setSelectValue(fixture, "moveTarget-generic", "FLD-news");
    clickButton(fixture, "Move");
    await settle(fixture);

    expect(contentTypeApi.moveContentTypeDefinition).toHaveBeenCalledWith("generic", "FLD-news");
  });

  it("shows a forbidden message when schema folder creation is rejected", async () => {
    contentTypeApi.createSchemaFolder.mockRejectedValueOnce({
      status: 403,
      message: "Administrator permission is required for schema administration.",
      validationMessages: []
    });
    const fixture = await renderPage();

    setInputValue(fixture, "newSchemaFolderName", "archive");
    clickButton(fixture, "Create folder");
    await settle(fixture);

    expect(pageText(fixture)).toContain(
      "Administrator permission is required for schema administration."
    );
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

function input(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): HTMLInputElement {
  const element = fixture.nativeElement.querySelector(
    `input[name="${name}"], input[data-name="${name}"]`
  ) as HTMLInputElement | null;

  if (!element) {
    throw new Error(`Input ${name} was not found.`);
  }

  return element;
}

function inputValue(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): string {
  return input(fixture, name).value;
}

function setInputValue(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string,
  value: string
): void {
  const element = input(fixture, name);

  element.value = value;
  element.dispatchEvent(new Event("input"));
  fixture.detectChanges();
}

function select(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): HTMLSelectElement {
  const element = fixture.nativeElement.querySelector(
    `select[name="${name}"], select[data-name="${name}"]`
  ) as HTMLSelectElement | null;

  if (!element) {
    throw new Error(`Select ${name} was not found.`);
  }

  return element;
}

function selectValue(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): string {
  return select(fixture, name).value;
}

function setSelectValue(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string,
  value: string
): void {
  const element = select(fixture, name);

  element.value = value;
  element.dispatchEvent(new Event("change"));
  fixture.detectChanges();
}

function clickButton(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  text: string
): void {
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll("button")
  ) as HTMLButtonElement[];
  const button = buttons.find((candidate) => candidate.textContent?.trim() === text);

  if (!button) {
    throw new Error(`Button ${text} was not found.`);
  }

  button.click();
}

function clickAriaButton(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  ariaLabel: string
): void {
  const button = fixture.nativeElement.querySelector(
    `button[aria-label="${ariaLabel}"]`
  ) as HTMLButtonElement | null;

  if (!button) {
    throw new Error(`Button with aria-label ${ariaLabel} was not found.`);
  }

  button.click();
}

function formElement(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  ariaLabel: string
): HTMLFormElement {
  const form = fixture.nativeElement.querySelector(
    `form[aria-label="${ariaLabel}"]`
  ) as HTMLFormElement | null;

  if (!form) {
    throw new Error(`Form ${ariaLabel} was not found.`);
  }

  return form;
}

function clickFormButton(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  formLabel: string,
  text: string
): void {
  const form = formElement(fixture, formLabel);
  const button = Array.from(form.querySelectorAll("button")).find(
    (candidate) => (candidate as HTMLButtonElement).textContent?.trim() === text
  ) as HTMLButtonElement | undefined;

  if (!button) {
    throw new Error(`Button ${text} in form ${formLabel} was not found.`);
  }

  button.click();
}

function clickFieldRowButton(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  formLabel: string,
  rowIndex: number,
  ariaLabel: string
): void {
  const form = formElement(fixture, formLabel);
  const rows = Array.from(form.querySelectorAll(".field-row"));
  const row = rows[rowIndex];

  if (!row) {
    throw new Error(`Field row ${rowIndex} in form ${formLabel} was not found.`);
  }

  const button = row.querySelector(`button[aria-label="${ariaLabel}"]`) as HTMLButtonElement | null;

  if (!button) {
    throw new Error(`Button ${ariaLabel} in field row ${rowIndex} was not found.`);
  }

  button.click();
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

function schemaWithFields(
  name: string,
  version: string,
  fieldNames: string[]
): ContentTypeSchemaDefinition {
  return {
    name,
    version,
    fields: fieldNames.map((fieldName) => ({
      name: fieldName,
      type: "string" as const,
      required: false
    }))
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
