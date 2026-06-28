import { describe, expect, it } from "vitest";

import { NotImplementedSchemaParser } from "./index";

describe("schema parser placeholder", () => {
  it("fails explicitly until YAML parsing is implemented", () => {
    const parser = new NotImplementedSchemaParser();

    expect(() => parser.parse("name: generic")).toThrow("not implemented");
  });
});
