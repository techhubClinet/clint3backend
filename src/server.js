import cron from "node-cron";

import { connectDb } from "./config/db.js";
import { configureCloudinary, isCloudinaryConfigured } from "./config/cloudinary.js";
import { settings, isVercel } from "./config/settings.js";
import { createApp } from "./expressApp.js";
import {
  exportFullDatabaseBackup,
  uploadBackupToCloudinary,
} from "./services/backupService.js";

const app = createApp();
const PORT = settings.port;

async function startScheduledBackups() {
  if (isVercel()) return;
  if (!settings.enableScheduledBackups) return;
  if (!isCloudinaryConfigured()) {
    console.warn(
      "[backup] Scheduled backups disabled: Cloudinary not configured in settings.js"
    );
    return;
  }
  configureCloudinary();
  const expr = settings.backupCron;
  const tz = settings.backupTimezone;
  cron.schedule(
    expr,
    async () => {
      try {
        const payload = await exportFullDatabaseBackup();
        const result = await uploadBackupToCloudinary(payload, "cron-full");
        console.log("[backup] Uploaded:", result.secure_url);
      } catch (e) {
        console.error("[backup] Cron failed:", e.message);
      }
    },
    { timezone: tz }
  );
  console.log(`[backup] Scheduled (${expr}, ${tz})`);
}

async function main() {
  const uri = settings.mongodbUri;
  if (!uri) {
    console.error("mongodbUri missing in src/config/settings.js");
    process.exit(1);
  }
  if (!settings.jwtSecret && settings.nodeEnv === "production") {
    console.error("jwtSecret missing in src/config/settings.js");
    process.exit(1);
  }

  await connectDb(uri);
  configureCloudinary();

  app.listen(PORT, () => {
    console.log(`Creative Ops API listening on port ${PORT}`);
  });

  await startScheduledBackups();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
