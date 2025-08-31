import { z } from "zod";

// DND (Do Not Disturb) time window schema
// Validates HH:MM format (24-hour)
export const DndSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM")
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
  eventId: z.string(),
  userId: z.string(),
  eventType: z.string(),
  timestamp: z.string().datetime() // ISO 8601 format validation
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
