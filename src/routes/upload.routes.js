import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
  configureCloudinary,
  isCloudinaryConfigured,
} from "../config/cloudinary.js";
import { MediaAsset } from "../models/MediaAsset.js";
import mongoose from "mongoose";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!isCloudinaryConfigured()) {
      throw new AppError(
        "Cloudinary is not configured. Set CLOUDINARY_* env vars.",
        503
      );
    }
    configureCloudinary();

    if (!req.file) {
      throw new AppError('Missing file field "file"', 400);
    }

    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "creative-ops";
    const brandIdRaw = req.body.brandId || req.query.brandId;
    let brandId;
    if (brandIdRaw && mongoose.isValidObjectId(brandIdRaw)) {
      brandId = brandIdRaw;
    }

    const resourceType =
      req.file.mimetype.startsWith("video/") ? "video" : "image";

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${folder}/media`,
          resource_type: resourceType === "video" ? "video" : "image",
        },
        (err, r) => (err ? reject(err) : resolve(r))
      );
      stream.end(req.file.buffer);
    });

    const asset = await MediaAsset.create({
      brandId,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      originalFilename: req.file.originalname,
      createdBy: req.user.id,
    });

    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
      mediaAssetId: asset.id,
    });
  })
);

export default router;
