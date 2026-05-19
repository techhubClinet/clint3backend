/**
 * App configuration — edit values here.
 * No .env file required (works on Vercel without dashboard env vars).
 */
export const settings = {
  nodeEnv: process.env.VERCEL ? "production" : "development",
  port: 4000,
  clientOrigin: "http://localhost:5173",

  mongodbUri:
    "mongodb+srv://ali:ali@cluster0.o8bu9nt.mongodb.net/creative_ops?retryWrites=true&w=majority&appName=Cluster0",

  jwtSecret: "creative-ops-jwt-secret-replace-with-long-random-string",
  jwtExpiresIn: "7d",

  adminEmail: "admin1234@gmail.com",
  adminPassword: "admin1234",

  cloudinaryCloudName: "",
  cloudinaryApiKey: "",
  cloudinaryApiSecret: "",
  cloudinaryUploadFolder: "creative-ops",

  enableScheduledBackups: false,
  backupCron: "0 3 * * *",
  backupTimezone: "UTC",

  /** Used by CLI scripts (import:backup, test:flow) */
  apiBase: "http://127.0.0.1:4000",
};

/** Vercel sets this automatically — not user config. */
export function isVercel() {
  return Boolean(process.env.VERCEL);
}

export function isProduction() {
  return settings.nodeEnv === "production";
}
