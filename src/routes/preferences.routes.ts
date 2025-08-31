import { Router } from "express";
import { PreferencesStore } from "../store/memory.store";
import { PreferencesSchema } from "../types/models";

const router = Router();

/**
 * GET /preferences/:userId
 * Retrieve user notification preferences by userId
 * 
 * Response:
 * - 200: User preferences JSON
 * - 404: { "error": "Not found" } if user has no preferences
 */
router.get("/:userId", (req, res) => {
  const { userId } = req.params;
  
  // Look up preferences in in-memory store
  const prefs = PreferencesStore.get(userId);
  if (!prefs) {
    return res.status(404).json({ error: "Not found" });
  }
  
  res.json(prefs);
});

/**
 * POST /preferences/:userId
 * Save or update user notification preferences
 * 
 * Request body: { dnd?, eventSettings }
 * 
 * Response:
 * - 201: { "status": "saved", "userId": "..." } on success
 * - 400: Validation error with Zod details
 */
router.post("/:userId", (req, res) => {
  const { userId } = req.params;

  // Validate request body using Zod schema
  const parsed = PreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: "Invalid preferences", 
      details: parsed.error.flatten() 
    });
  }

  // Store the validated preferences
  PreferencesStore.set(userId, parsed.data);
  
  // Return 201 (Created) for both new and updated preferences
  res.status(201).json({ status: "saved", userId });
});

export default router;
