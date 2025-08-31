/**
 * Time utilities for handling DND (Do Not Disturb) windows
 * All time operations are performed in UTC
 */

/**
 * Parse HH:MM format to minutes since midnight
 * @param hhmm - Time string in HH:MM format (e.g., "14:30")
 * @returns Minutes since midnight (e.g., 870 for 14:30)
 */
export function parseHmToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Extract minutes since midnight from ISO UTC timestamp
 * @param iso - ISO 8601 timestamp string (e.g., "2025-08-30T14:30:00Z")
 * @returns Minutes since midnight in UTC
 */
export function minutesSinceMidnightFromIsoUtc(iso: string): number {
  const date = new Date(iso);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/**
 * Check if current time is within DND window
 * Correctly handles windows that cross midnight (e.g., 22:00-07:00)
 * 
 * @param nowMin - Current time in minutes since midnight
 * @param startMin - DND start time in minutes since midnight
 * @param endMin - DND end time in minutes since midnight
 * @returns true if current time is within DND window
 * 
 * Examples:
 * - DND 22:00-07:00 (1320-420): blocks 23:00, 02:00, allows 21:00, 08:00
 * - DND 09:00-17:00 (540-1020): blocks 12:00, allows 08:00, 18:00
 * - DND 12:00-12:00: inactive (returns false)
 */
export function isInDndWindow(nowMin: number, startMin: number, endMin: number): boolean {
  // If start equals end, DND is inactive
  if (startMin === endMin) {
    return false;
  }
  
  // Handle windows that cross midnight
  if (startMin > endMin) {
    // Example: 22:00-07:00 (1320-420 minutes)
    // Block if: time >= 22:00 OR time <= 07:00
    return nowMin >= startMin || nowMin < endMin;
  } else {
    // Example: 09:00-17:00 (540-1020 minutes)
    // Block if: 09:00 <= time <= 17:00
    return nowMin >= startMin && nowMin < endMin;
  }
} 