import { createApp } from "../src/app.js";
import { connectDb } from "../src/config/db.js";
import { configureCloudinary } from "../src/config/cloudinary.js";
import { settings, isProduction } from "../src/config/settings.js";

const app = createApp();

let dbReady = false;
let dbError = null;

async function ensureDb() {
  if (dbReady) return;
  if (dbError) throw dbError;

  const uri = settings.mongodbUri;
  if (!uri) {
    dbError = new Error("mongodbUri is missing in src/config/settings.js");
    throw dbError;
  }
  if (!settings.jwtSecret && isProduction()) {
    dbError = new Error("jwtSecret is missing in src/config/settings.js");
    throw dbError;
  }

  await connectDb(uri);
  configureCloudinary();
  dbReady = true;
}

/** Vercel serverless entry — connects to MongoDB once per instance, then runs Express. */
export default async function handler(req, res) {
  try {
    await ensureDb();
    return app(req, res);
  } catch (err) {
    console.error("[vercel] handler error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message || "Server error" }));
    }
  }
}
