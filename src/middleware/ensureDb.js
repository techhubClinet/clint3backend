import { connectDb } from "../config/db.js";
import { configureCloudinary } from "../config/cloudinary.js";
import { settings } from "../config/settings.js";

let ready = false;
let pending = null;

export async function ensureDbConnected() {
  if (ready) return;
  if (!pending) {
    const uri = settings.mongodbUri;
    if (!uri) {
      throw new Error("mongodbUri is missing in src/config/settings.js");
    }
    pending = connectDb(uri)
      .then(() => {
        configureCloudinary();
        ready = true;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  await pending;
}

/** Connect to MongoDB on first request (Vercel serverless). */
export function ensureDbMiddleware(req, res, next) {
  ensureDbConnected().then(() => next()).catch(next);
}
