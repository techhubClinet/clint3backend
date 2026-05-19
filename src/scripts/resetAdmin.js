/**
 * Create or update admin from ADMIN_EMAIL / ADMIN_PASSWORD in .env
 * Usage: npm run reset:admin
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.js";

async function run() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!uri || !email || !password) {
    console.error("Set MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD in .env");
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
