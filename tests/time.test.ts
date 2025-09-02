import { parseHmToMinutes, minutesSinceMidnightFromIsoUtc, isInDndWindow } from "../src/utils/time";

describe("Time Utilities", () => {
  describe("parseHmToMinutes", () => {
    test("should convert HH:MM to minutes since midnight", () => {
      expect(parseHmToMinutes("00:00")).toBe(0);
      expect(parseHmToMinutes("01:30")).toBe(90);
      expect(parseHmToMinutes("12:00")).toBe(720);
      expect(parseHmToMinutes("23:59")).toBe(1439);
    });

    test("should handle edge cases", () => {
      expect(parseHmToMinutes("00:01")).toBe(1);
      expect(parseHmToMinutes("09:15")).toBe(555);
      expect(parseHmToMinutes("22:00")).toBe(1320);
      expect(parseHmToMinutes("07:00")).toBe(420);
    });

    test("should handle invalid time inputs gracefully", () => {
      // Note: Zod validation at API level prevents these from reaching this function
      // These tests document the function's behavior with invalid inputs
      expect(parseHmToMinutes("24:00")).toBe(1440); // Invalid hour (should be 0-23)
      expect(parseHmToMinutes("23:60")).toBe(1440); // Invalid minute (should be 0-59)
      expect(parseHmToMinutes("25:00")).toBe(1500); // Invalid hour
      expect(parseHmToMinutes("aa:bb")).toBeNaN();  // Non-numeric input
      expect(parseHmToMinutes("12:")).toBe(720);    // Missing minutes (treated as 0)
      expect(parseHmToMinutes(":30")).toBe(30);     // Missing hours (treated as 0)
    });
  });
  

  describe("minutesSinceMidnightFromIsoUtc", () => {
    test("should extract minutes since midnight from ISO UTC timestamp", () => {
      expect(minutesSinceMidnightFromIsoUtc("2025-08-30T00:00:00Z")).toBe(0);
      expect(minutesSinceMidnightFromIsoUtc("2025-08-30T01:30:00Z")).toBe(90);
      expect(minutesSinceMidnightFromIsoUtc("2025-08-30T12:00:00Z")).toBe(720);
      expect(minutesSinceMidnightFromIsoUtc("2025-08-30T23:59:00Z")).toBe(1439);
    });

    test("should work with different dates", () => {
      expect(minutesSinceMidnightFromIsoUtc("2023-01-01T14:30:00Z")).toBe(870);
      expect(minutesSinceMidnightFromIsoUtc("2025-12-31T22:15:00Z")).toBe(1335);
      expect(minutesSinceMidnightFromIsoUtc("2025-08-30T07:00:00Z")).toBe(420);
    });
  });

  describe("isInDndWindow", () => {
    test("should handle DND window within same day", () => {
      // 9:00 AM to 5:00 PM [540, 1020) - half-open interval
      const startMin = 540;
      const endMin = 1020;
      
      // Inside window [start, end)
      expect(isInDndWindow(540, startMin, endMin)).toBe(true);  // Exactly 9:00 AM (inclusive)
      expect(isInDndWindow(600, startMin, endMin)).toBe(true);  // 10:00 AM
      expect(isInDndWindow(1019, startMin, endMin)).toBe(true); // 4:59 PM
      
      // Outside window
      expect(isInDndWindow(539, startMin, endMin)).toBe(false); // 8:59 AM
      expect(isInDndWindow(1020, startMin, endMin)).toBe(false); // Exactly 5:00 PM (exclusive)
      expect(isInDndWindow(1021, startMin, endMin)).toBe(false); // 5:01 PM
    });

    test("should handle DND window crossing midnight", () => {
      // 10:00 PM to 7:00 AM [1320, 420) - half-open interval crossing midnight
      const startMin = 1320;
      const endMin = 420;
      
      // Inside window (late night)
      expect(isInDndWindow(1320, startMin, endMin)).toBe(true); // Exactly 10:00 PM (inclusive)
      expect(isInDndWindow(1380, startMin, endMin)).toBe(true); // 11:00 PM
      expect(isInDndWindow(1439, startMin, endMin)).toBe(true); // 23:59 PM
      
      // Inside window (early morning)
      expect(isInDndWindow(0, startMin, endMin)).toBe(true);    // Midnight
      expect(isInDndWindow(60, startMin, endMin)).toBe(true);   // 1:00 AM
      expect(isInDndWindow(419, startMin, endMin)).toBe(true);  // 6:59 AM
      
      // Outside window
      expect(isInDndWindow(1319, startMin, endMin)).toBe(false); // 9:59 PM
      expect(isInDndWindow(420, startMin, endMin)).toBe(false);  // Exactly 7:00 AM (exclusive)
      expect(isInDndWindow(421, startMin, endMin)).toBe(false);  // 7:01 AM
      expect(isInDndWindow(720, startMin, endMin)).toBe(false);  // 12:00 PM (noon)
    });

    test("should handle equal start and end times as inactive DND", () => {
      // When start === end, DND should be inactive
      expect(isInDndWindow(500, 800, 800)).toBe(false);
      expect(isInDndWindow(800, 800, 800)).toBe(false);
      expect(isInDndWindow(1000, 800, 800)).toBe(false);
    });

    test("should handle edge case at midnight boundaries", () => {
      // 23:00 to 01:00 [1380, 60) - half-open interval
      const startMin = 1380;
      const endMin = 60;
      
      expect(isInDndWindow(1380, startMin, endMin)).toBe(true); // 23:00 (inclusive)
      expect(isInDndWindow(0, startMin, endMin)).toBe(true);    // 00:00
      expect(isInDndWindow(59, startMin, endMin)).toBe(true);   // 00:59
      expect(isInDndWindow(60, startMin, endMin)).toBe(false);  // 01:00 (exclusive)
      expect(isInDndWindow(61, startMin, endMin)).toBe(false);  // 01:01
      expect(isInDndWindow(1379, startMin, endMin)).toBe(false); // 22:59
    });

    test("should handle real-world DND scenarios", () => {
      // Common scenario: 22:00 to 07:00 (night time DND)
      const nightDndStart = 1320; // 22:00
      const nightDndEnd = 420;    // 07:00
      
      // Should block late night notifications
      expect(isInDndWindow(1380, nightDndStart, nightDndEnd)).toBe(true); // 23:00
      expect(isInDndWindow(120, nightDndStart, nightDndEnd)).toBe(true);  // 02:00
      expect(isInDndWindow(360, nightDndStart, nightDndEnd)).toBe(true);  // 06:00
      
      // Should allow day time notifications
      expect(isInDndWindow(480, nightDndStart, nightDndEnd)).toBe(false); // 08:00
      expect(isInDndWindow(720, nightDndStart, nightDndEnd)).toBe(false); // 12:00
      expect(isInDndWindow(1200, nightDndStart, nightDndEnd)).toBe(false); // 20:00
    });

    test("should handle boundary assertions explicitly", () => {
      // Cross-midnight: 22:00 inclusive, 07:00 exclusive
      expect(isInDndWindow(1320, 1320, 420)).toBe(true);  // 22:00 (start boundary - inclusive)
      expect(isInDndWindow(420, 1320, 420)).toBe(false);  // 07:00 (end boundary - exclusive)
      
      // Same-day: 09:00 inclusive, 17:00 exclusive  
      expect(isInDndWindow(540, 540, 1020)).toBe(true);   // 09:00 (start boundary - inclusive)
      expect(isInDndWindow(1020, 540, 1020)).toBe(false); // 17:00 (end boundary - exclusive)
      
      // Edge case: one minute before/after boundaries
      expect(isInDndWindow(1319, 1320, 420)).toBe(false); // 21:59 (before start)
      expect(isInDndWindow(1321, 1320, 420)).toBe(true);  // 22:01 (after start)
      expect(isInDndWindow(419, 1320, 420)).toBe(true);   // 06:59 (before end)
      expect(isInDndWindow(421, 1320, 420)).toBe(false);  // 07:01 (after end)
    });
  });
});
