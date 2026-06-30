import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { ContentTypeSchemaDefinition, ContentTypeSchemaSummary } from "@ecmp/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContentTypeApiClient } from "../infrastructure/content-type-api.client";
import { ContentTypeSchemasPageComponent } from "./content-type-schemas-page.component";

describe("content type schemas page integration", () => {
  let summaries: ContentTypeSchemaSummary[];
  let definitions: Map<string, ContentTypeSchemaDefinition>;
  let contentTypeApi: {
    listSchemas: ReturnType<typeof vi.fn>;
    getLatestSchema: ReturnType<typeof vi.fn>;
    getSchemaVersion: ReturnType<typeof vi.fn>;
    createSchema: ReturnType<typeof vi.fn>;
    replaceSchemaVersion: ReturnType<typeof vi.fn>;
    deactivateSchemaVersion: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    summaries = [{ name: "generic", version: "1.0", active: true }];
    definitions = new Map([[schemaKey("generic", "1.0"), schema("generic", "1.0")]]);
    contentTypeApi = {
      listSchemas: vi.fn(() => Promise.resolve([...summaries])),
      getLatestSchema: vi.fn(),
      getSchemaVersion: vi.fn((name: string, version: string) =>
        Promise.resolve(definitions.get(schemaKey(name, version)))
      ),
      createSchema: vi.fn((source: string) => {
        const definition = source.includes("article")
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
      })
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

  it("creates a schema from YAML and displays the returned normalized schema", async () => {
    const fixture = await renderPage();

    setTextarea(fixture, "createSchemaSource", articleYaml());
    clickButton(fixture, "Create schema");
    await settle(fixture);

    expect(contentTypeApi.createSchema).toHaveBeenCalledWith(articleYaml());
    expect(pageText(fixture)).toContain("article");
    expect(pageText(fixture)).toContain("headline");
  });

  it("preserves create YAML and shows backend validation feedback", async () => {
    contentTypeApi.createSchema.mockRejectedValueOnce({
      status: 400,
      message: "Content type schema is invalid.",
      validationMessages: ["Schema source must be valid YAML."]
    });
    const fixture = await renderPage();

    setTextarea(fixture, "createSchemaSource", "name: [");
    clickButton(fixture, "Create schema");
    await settle(fixture);

    expect(pageText(fixture)).toContain("Content type schema is invalid.");
    expect(pageText(fixture)).toContain("Schema source must be valid YAML.");
    expect(textarea(fixture, "createSchemaSource").value).toBe("name: [");
  });

  it("replaces the selected schema from YAML and displays the replacement fields", async () => {
    const fixture = await renderPage();

    setTextarea(
      fixture,
      "replaceSchemaSource",
      `name: generic
version: 1.0
fields:
  headline:
    type: string
    required: true
`
    );
    clickButton(fixture, "Replace schema");
    await settle(fixture);

    expect(contentTypeApi.replaceSchemaVersion).toHaveBeenCalledWith(
      "generic",
      "1.0",
      expect.stringContaining("headline")
    );
    expect(pageText(fixture)).toContain("headline");
  });

  it("preserves replace YAML and shows backend conflict feedback", async () => {
    contentTypeApi.replaceSchemaVersion.mockRejectedValueOnce({
      status: 409,
      message: "Content type schema name or version does not match.",
      validationMessages: []
    });
    const fixture = await renderPage();
    const replacementYaml = `name: article
version: 1.0
fields:
  headline:
    type: string
    required: true
`;

    setTextarea(fixture, "replaceSchemaSource", replacementYaml);
    clickButton(fixture, "Replace schema");
    await settle(fixture);

    expect(pageText(fixture)).toContain("Content type schema name or version does not match.");
    expect(textarea(fixture, "replaceSchemaSource").value).toBe(replacementYaml);
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

function textarea(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string
): HTMLTextAreaElement {
  const element = fixture.nativeElement.querySelector(
    `textarea[name="${name}"]`
  ) as HTMLTextAreaElement | null;

  if (!element) {
    throw new Error(`Textarea ${name} was not found.`);
  }

  return element;
}

function setTextarea(
  fixture: ComponentFixture<ContentTypeSchemasPageComponent>,
  name: string,
  value: string
): void {
  const element = textarea(fixture, name);

  element.value = value;
  element.dispatchEvent(new Event("input"));
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
    fields: {
      [fieldName]: { type: "string", required: true }
    }
  };
}

function articleYaml(): string {
  return `name: article
version: 1.0
fields:
  headline:
    type: string
    required: true
`;
}
