import express, { Request, Response, NextFunction } from "express";
import preferencesRouter from "./routes/preferences.routes";
import eventsRouter from "./routes/events.routes";

// Create Express application
export const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/preferences", preferencesRouter);
app.use("/events", eventsRouter);

// Health check endpoint
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Global error handler
// This catches any unhandled errors in the application
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});