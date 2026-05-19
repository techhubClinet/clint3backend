/**
 * Create or update admin from src/config/settings.js
 * Usage: npm run reset:admin
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { settings } from "../config/settings.js";
import { User } from "../models/User.js";

async function run() {
  const uri = settings.mongodbUri;
  const email = settings.adminEmail?.trim().toLowerCase();
  const password = settings.adminPassword;

  if (!uri || !email || !password) {
    console.error("Set mongodbUri, adminEmail, adminPassword in src/config/settings.js");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.findOneAndUpdate(
    { email },
    { email, passwordHash, role: "admin" },
    { upsert: true, new: true }
  );
  console.log("Admin ready:", user.email);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
