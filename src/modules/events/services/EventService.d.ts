import type { Event } from "@prisma/client";

export class EventService {
  createEvent(args: { type: string; payload: unknown }): Promise<Event>;
  static requeuePendingEvents(): Promise<void>;
}
