import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { settings, isVercel } from "./config/settings.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ensureDbMiddleware } from "./middleware/ensureDb.js";

import authRoutes from "./routes/auth.routes.js";
import brandsRoutes from "./routes/brands.routes.js";
import batchesRoutes from "./routes/batches.routes.js";
import loopsRoutes from "./routes/loops.routes.js";
import docsRoutes from "./routes/docs.routes.js";
import ideasRoutes from "./routes/ideas.routes.js";
import importRoutes from "./routes/import.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import backupRoutes from "./routes/backup.routes.js";

/** Vercel serverless has a ~4.5MB request body limit; local/dev allows large JSON imports. */
const jsonLimit = isVercel() ? "4mb" : "80mb";

export function createApp() {
  const app = express();

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    ...(isVercel() ? { validate: { trustProxy: false } } : {}),
  });

  app.set("trust proxy", 1);

  if (isVercel()) {
    app.use(ensureDbMiddleware);
  }

  app.use(helmet());
  app.use(limiter);
  app.use(
    cors({
      origin: settings.clientOrigin || "*",
      credentials: true,
    })
  );
  app.use(express.json({ limit: jsonLimit }));

  app.get("/", (req, res) => {
    res.json({
      name: "Creative Ops API",
      status: "ok",
      health: "/health",
      docs: "See backend/README.md",
    });
  });

  app.get("/favicon.ico", (req, res) => res.status(204).end());

  app.get("/health", (req, res) => {
    res.json({
      ok: true,
      uptime: process.uptime(),
      platform: isVercel() ? "vercel" : "node",
    });
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

  return app;
}
