import type { UserId } from "@ecmp/shared-types";

export interface EventEnvelope<TPayload> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  source: string;
  actorId?: UserId;
  data: TPayload;
}

export type PublicationEventType =
  | "PublicationRequested"
  | "PublicationCompleted"
  | "PublicationFailed"
  | "UnpublicationRequested"
  | "UnpublicationCompleted"
  | "UnpublicationFailed";
