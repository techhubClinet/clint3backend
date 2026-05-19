import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import mongoose from "mongoose";
import {
  exportBrandBackup,
  exportFullDatabaseBackup,
  uploadBackupToCloudinary,
} from "../services/backupService.js";
import { isCloudinaryConfigured } from "../config/cloudinary.js";

const router = Router();

router.use(requireAuth);

/** Same shape as frontend export for one brand */
router.get(
  "/export",
  asyncHandler(async (req, res) => {
    const brandId = req.query.brandId;
    if (!brandId || !mongoose.isValidObjectId(brandId)) {
      throw new AppError("Query brandId is required", 400);
    }
    const payload = await exportBrandBackup(brandId);
    if (!payload) throw new AppError("Brand not found", 404);
    res.json(payload);
  })
);

/** Full snapshot of all brands (for disaster recovery) */
router.get(
  "/export-full",
  asyncHandler(async (req, res) => {
    const payload = await exportFullDatabaseBackup();
    res.json(payload);
  })
);

/** Manual trigger: upload full DB backup JSON to Cloudinary */
router.post(
  "/upload-remote",
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured()) {
      throw new AppError("Cloudinary not configured", 503);
    }
    const payload = await exportFullDatabaseBackup();
    const result = await uploadBackupToCloudinary(payload, "scheduled-full");
    res.json({
      ok: true,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
    });
  })
);

export default router;
