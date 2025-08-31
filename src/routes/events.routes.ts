import { Router } from "express";
import { IncomingEventSchema } from "../types/models";
import { PreferencesStore } from "../store/memory.store";
import { makeDecision } from "../services/decision.service";

const router = Router();

/**
 * POST /events
 * Process an incoming event and decide whether to send a notification
 * 
 * Request body: { eventId, userId, eventType, timestamp }
 * 
 * Response:
 * - 202: { "decision": "PROCESS_NOTIFICATION" } - Send the notification
 * - 200: { "decision": "DO_NOT_NOTIFY", "reason": "..." } - Suppress the notification
 * - 400: Validation error with details
 */
router.post("/", (req, res) => {
  // Validate the incoming event payload using Zod schema
  const parsed = IncomingEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: "Invalid event", 
      details: parsed.error.flatten() 
    });
  }

  const event = parsed.data;
  
  // Look up user preferences from in-memory store
  const prefs = PreferencesStore.get(event.userId);
  
  // Make decision based on preferences and DND rules
  const decision = makeDecision(event, prefs);

  // Return appropriate status code based on decision
  // 202 = Accepted (will process notification)
  // 200 = OK (will not process notification)
  const statusCode = decision.decision === "PROCESS_NOTIFICATION" ? 202 : 200;
  
  res.status(statusCode).json(decision);
});

export default router; 