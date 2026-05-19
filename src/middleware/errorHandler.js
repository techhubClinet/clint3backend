import mongoose from "mongoose";
import multer from "multer";
import { isProduction } from "../config/settings.js";

export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message, code: err.code });
  }
  const status = err.statusCode || 500;
  const message =
    status === 500 && isProduction()
      ? "Internal server error"
      : err.message;

  if (err.code === 11000) {
    return res.status(409).json({
      error: "Duplicate record",
      detail: err.keyValue || undefined,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map((e) => e.message),
    });
  }

  res.status(status).json({
    error: message,
    ...(!isProduction() && err.stack ? { stack: err.stack } : {}),
  });
}
