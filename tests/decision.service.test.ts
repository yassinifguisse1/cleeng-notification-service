import { makeDecision } from "../src/services/decision.service";
import { Event, Preferences } from "../src/types/models";

describe("Decision Service", () => {
  const baseEvent: Event = {
    eventId: "e1",
    userId: "u1",
    eventType: "item_shipped",
    timestamp: "2025-08-30T12:00:00Z" // Noon UTC
  };

  test("should process notification when no preferences exist", () => {
    const result = makeDecision(baseEvent, undefined);
    expect(result).toEqual({ decision: "PROCESS_NOTIFICATION" });
  });

  test("should not notify when user is unsubscribed from event", () => {
    const prefs: Preferences = {
      eventSettings: {
        "item_shipped": { enabled: false }
      }
    };
    
    const result = makeDecision(baseEvent, prefs);
    expect(result).toEqual({
      decision: "DO_NOT_NOTIFY",
      reason: "USER_UNSUBSCRIBED_FROM_EVENT"
    });
  });

  test("should not notify when event is missing from settings", () => {
    const prefs: Preferences = {
      eventSettings: {
        "other_event": { enabled: true }
      }
    };
    
    const result = makeDecision(baseEvent, prefs);
    expect(result).toEqual({
      decision: "DO_NOT_NOTIFY",
      reason: "USER_UNSUBSCRIBED_FROM_EVENT"
    });
  });

  test("should not notify when in DND window", () => {
    const prefs: Preferences = {
      dnd: { start: "10:00", end: "14:00" },
      eventSettings: {
        "item_shipped": { enabled: true }
      }
    };
    
    const result = makeDecision(baseEvent, prefs); // Event at noon (12:00)
    expect(result).toEqual({
      decision: "DO_NOT_NOTIFY",
      reason: "DND_ACTIVE"
    });
  });

  test("should process notification when outside DND window", () => {
    const prefs: Preferences = {
      dnd: { start: "14:00", end: "18:00" },
      eventSettings: {
        "item_shipped": { enabled: true }
      }
    };
    
    const result = makeDecision(baseEvent, prefs); // Event at noon (12:00)
    expect(result).toEqual({ decision: "PROCESS_NOTIFICATION" });
  });

  test("should process notification when DND start equals end", () => {
    const prefs: Preferences = {
      dnd: { start: "12:00", end: "12:00" }, // Inactive DND
      eventSettings: {
        "item_shipped": { enabled: true }
      }
    };
    
    const result = makeDecision(baseEvent, prefs);
    expect(result).toEqual({ decision: "PROCESS_NOTIFICATION" });
  });
}); 