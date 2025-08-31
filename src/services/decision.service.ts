import { Preferences, Event, Decision } from "../types/models";
import { parseHmToMinutes, minutesSinceMidnightFromIsoUtc, isInDndWindow } from "../utils/time";

/**
 * Decision service for determining whether to process or suppress notifications
 * Based on user preferences and DND (Do Not Disturb) windows
 */

/**
 * Make a decision about whether to process a notification for a given event
 * 
 * Decision logic:
 * 1. If no preferences exist for user -> PROCESS (default behavior)
 * 2. If event type is not subscribed -> DO_NOT_NOTIFY (USER_UNSUBSCRIBED_FROM_EVENT)
 * 3. If event timestamp is within DND window -> DO_NOT_NOTIFY (DND_ACTIVE)
 * 4. Otherwise -> PROCESS_NOTIFICATION
 * 
 * @param event - The incoming event to process
 * @param prefs - User preferences (can be undefined if user has no preferences)
 * @returns Decision object with action and optional reason
 */
export function makeDecision(event: Event, prefs: Preferences | undefined): Decision {
  // Default behavior: if no preferences found, process the notification
  // This is a business decision - we choose to be permissive by default
  if (!prefs) {
    return { decision: "PROCESS_NOTIFICATION" };
  }

  // Check if user is subscribed to this event type
  // If eventSettings[eventType] is missing or enabled=false, treat as unsubscribed
  const eventSetting = prefs.eventSettings?.[event.eventType];
  if (!eventSetting || !eventSetting.enabled) {
    return {
      decision: "DO_NOT_NOTIFY",
      reason: "USER_UNSUBSCRIBED_FROM_EVENT"
    };
  }

  // Check DND window if configured
  if (prefs.dnd) {
    // Convert all times to minutes since midnight for comparison
    const nowMinutes = minutesSinceMidnightFromIsoUtc(event.timestamp);
    const startMinutes = parseHmToMinutes(prefs.dnd.start);
    const endMinutes = parseHmToMinutes(prefs.dnd.end);
    
    // Check if event timestamp falls within DND window
    if (isInDndWindow(nowMinutes, startMinutes, endMinutes)) {
      return {
        decision: "DO_NOT_NOTIFY",
        reason: "DND_ACTIVE"
      };
    }
  }

  // All checks passed - process the notification
  return { decision: "PROCESS_NOTIFICATION" };
} 