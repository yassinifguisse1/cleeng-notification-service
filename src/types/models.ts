import { z } from "zod";

// DND (Do Not Disturb) time window schema
// Validates HH:MM format (24-hour)
const HHMM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const DndSchema = z.object({
  start: z.string().regex(HHMM, "dnd.start must be HH:MM in 24h format"),
  end:   z.string().regex(HHMM, "dnd.end must be HH:MM in 24h format"),
});

// Event setting schema for individual event types
export const EventSettingSchema = z.object({
  enabled: z.boolean()
});

// User preferences schema
// Contains DND window and per-event-type settings
export const PreferencesSchema = z.object({
  dnd: DndSchema.optional(),
  eventSettings: z.record(z.string(), EventSettingSchema) // e.g. { "item_shipped": { enabled: true } }
});

// Incoming event schema for POST /events
// Validates the event payload
export const IncomingEventSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1),
  eventType: z.string().min(1),
  timestamp: z.string().datetime(), // ISO 8601 (e.g. 2025-08-30T23:30:00Z)
});
// TypeScript types inferred from Zod schemas
export type Preferences = z.infer<typeof PreferencesSchema>;
export type Event = z.infer<typeof IncomingEventSchema>;

// Decision response types
export type DecisionType = "PROCESS_NOTIFICATION" | "DO_NOT_NOTIFY";
export type DecisionReason = "DND_ACTIVE" | "USER_UNSUBSCRIBED_FROM_EVENT";

export type Decision = {
  decision: DecisionType;
  reason?: DecisionReason;
};
