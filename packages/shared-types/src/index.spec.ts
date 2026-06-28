import { describe, expect, it } from "vitest";

import type { ContentId, Permission } from "./index";

describe("shared types", () => {
  it("supports prefixed content IDs and resource permissions", () => {
    const contentId: ContentId = "RCD-123";
    const permission: Permission = "folder:read";

    expect(contentId).toBe("RCD-123");
    expect(permission).toBe("folder:read");
  });
});
