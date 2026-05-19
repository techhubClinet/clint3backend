/**
 * One-time admin creation: npm run seed:admin
 * Uses adminEmail / adminPassword / mongodbUri from src/config/settings.js
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { settings } from "../config/settings.js";
import { User } from "../models/User.js";

async function run() {
  const uri = settings.mongodbUri;
  const email = settings.adminEmail;
  const password = settings.adminPassword;

  if (!uri || !email || !password) {
    console.error("Set mongodbUri, adminEmail, adminPassword in src/config/settings.js");
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
