/**
 * Vercel serverless entry — must default-export a function (not the Express app object).
 */
import { createApp } from "../src/expressApp.js";

const app = createApp();

export default function handler(req, res) {
  return app(req, res);
}
