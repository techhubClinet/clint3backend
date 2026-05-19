import { v2 as cloudinary } from "cloudinary";
import { Brand } from "../models/Brand.js";
import { Batch } from "../models/Batch.js";
import { FeedbackLoop } from "../models/FeedbackLoop.js";
import { ResearchDoc } from "../models/ResearchDoc.js";
import { Idea } from "../models/Idea.js";
import {
  toClientBatch,
  toClientLoop,
  toClientDoc,
  toClientIdea,
} from "../utils/serialize.js";
import { isCloudinaryConfigured, configureCloudinary } from "../config/cloudinary.js";
import { settings } from "../config/settings.js";

export async function exportBrandBackup(brandId) {
  const brand = await Brand.findById(brandId);
  if (!brand) return null;

  const [batches, loops, docs, ideas] = await Promise.all([
    Batch.find({ brandId }).lean(),
    FeedbackLoop.find({ brandId }).lean(),
    ResearchDoc.find({ brandId }).lean(),
    Idea.find({ brandId }).lean(),
  ]);

  return {
    batches: batches.map(toClientBatch),
    loops: loops.map(toClientLoop),
    docs: docs.map(toClientDoc),
    ideas: ideas.map(toClientIdea),
    exportDate: new Date().toISOString(),
  };
}

export async function exportFullDatabaseBackup() {
  const brands = await Brand.find().lean();
  const out = {
    meta: {
      exportDate: new Date().toISOString(),
      brands: brands.map((b) => ({
        id: String(b._id),
        name: b.name,
        slug: b.slug,
      })),
    },
    data: [],
  };

  for (const b of brands) {
    const snapshot = await exportBrandBackup(b._id);
    out.data.push({
      brand: {
        id: String(b._id),
        name: b.name,
        slug: b.slug,
      },
      ...snapshot,
    });
  }
  return out;
}

/**
 * Upload JSON backup as raw file to Cloudinary (requires cloudinary configured).
 */
export async function uploadBackupToCloudinary(jsonObject, filenamePrefix = "db-backup") {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }
  configureCloudinary();

  const buf = Buffer.from(JSON.stringify(jsonObject, null, 2), "utf8");
  const folder = settings.cloudinaryUploadFolder;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${folder}/backups`,
        resource_type: "raw",
        format: "json",
        public_id: `${filenamePrefix}-${stamp}`,
        overwrite: false,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    uploadStream.end(buf);
  });
}
