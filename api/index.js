/**
 * Vercel serverless entry — export Express app directly (required by @vercel/node).
 * DB connects on first request via ensureDbMiddleware in createApp().
 */
import { createApp } from "../src/app.js";

const app = createApp();

export default app;
