/**
 * One-time admin creation: npm run seed:admin
 * Requires ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI in .env
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.js";

async function run() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!uri || !email || !password) {
    console.error("Set MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.error("A user already exists. Seed aborted.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email, passwordHash, role: "admin" });
  console.log("Admin user created:", email);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
