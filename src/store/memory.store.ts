import { Preferences } from "../types/models";

// In-memory storage using Map for user preferences
// Note: Data will be lost when the application restarts
// In production, this would be replaced with a persistent database
const prefs = new Map<string, Preferences>(); // userId -> Preferences

/**
 * Simple in-memory store for user notification preferences
 */
export const PreferencesStore = {
  /**
   * Get user preferences by userId
   * @param userId - The user identifier
   * @returns User preferences or undefined if not found
   */
  get(userId: string): Preferences | undefined {
    return prefs.get(userId);
  },
  
  /**
   * Set or update user preferences
   * @param userId - The user identifier
   * @param p - The preferences to store
   */
  set(userId: string, p: Preferences): void {
    prefs.set(userId, p);
  }
};