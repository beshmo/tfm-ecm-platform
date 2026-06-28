import { describe, expect, it } from "vitest";

import type { EventEnvelope } from "./index";

describe("event envelope", () => {
  it("captures shared event metadata", () => {
    const event: EventEnvelope<{ contentId: string }> = {
      eventId: "evt-1",
      eventType: "PublicationRequested",
      eventVersion: 1,
      occurredAt: "2026-06-01T10:00:00.000Z",
      correlationId: "corr-1",
      source: "publication-service",
      data: { contentId: "RCD-1" }
    };

    expect(event.data.contentId).toBe("RCD-1");
  });
});
