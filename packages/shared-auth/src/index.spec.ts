import { describe, expect, it } from "vitest";

import { hasPermission, type AuthClaims } from "./index";

describe("permission helper", () => {
  it("matches wildcard actions for a resource", () => {
    const claims: AuthClaims = {
      sub: "USR-1",
      email: "creator@example.com",
      roles: ["Creator"],
      permissions: ["folder:*"]
    };

    expect(hasPermission(claims, "folder:create")).toBe(true);
    expect(hasPermission(claims, "workflow:create")).toBe(false);
  });
});
