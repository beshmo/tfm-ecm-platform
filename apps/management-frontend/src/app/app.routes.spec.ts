import { describe, expect, it } from "vitest";

import { routes } from "./app.routes";

describe("management frontend routes", () => {
  it("declares the initial Phase 2 route skeleton", () => {
    expect(routes.map((route) => route.path)).toEqual([
      "login",
      "folders",
      "folders/:folderId",
      "content-types",
      "",
      "**"
    ]);
  });
});
