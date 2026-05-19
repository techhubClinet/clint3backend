import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cron from "node-cron";

import { connectDb } from "./config/db.js";
import { configureCloudinary, isCloudinaryConfigured } from "./config/cloudinary.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import brandsRoutes from "./routes/brands.routes.js";
import batchesRoutes from "./routes/batches.routes.js";
import loopsRoutes from "./routes/loops.routes.js";
import docsRoutes from "./routes/docs.routes.js";
import ideasRoutes from "./routes/ideas.routes.js";
import importRoutes from "./routes/import.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import backupRoutes from "./routes/backup.routes.js";

import {
  exportFullDatabaseBackup,
  uploadBackupToCloudinary,
} from "./services/backupService.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.set("trust proxy", 1);
app.use(helmet());
app.use(limiter);
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "80mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use("/api/auth", authRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/brands/:brandId/batches", batchesRoutes);
app.use("/api/brands/:brandId/loops", loopsRoutes);
app.use("/api/brands/:brandId/docs", docsRoutes);
app.use("/api/brands/:brandId/ideas", ideasRoutes);
app.use("/api/import", importRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/backup", backupRoutes);

app.use(errorHandler);

async function startScheduledBackups() {
  if (process.env.ENABLE_SCHEDULED_BACKUPS !== "true") return;
  if (!isCloudinaryConfigured()) {
    console.warn(
      "[backup] Scheduled backups disabled: Cloudinary not configured"
    );
    return;
  }
  configureCloudinary();
  const expr = process.env.BACKUP_CRON || "0 3 * * *";
  const tz = process.env.BACKUP_TIMEZONE || "UTC";
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
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("Missing JWT_SECRET in production");
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
