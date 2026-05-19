import crypto from "crypto";
import mongoose from "mongoose";
import { Brand } from "../models/Brand.js";
import { Batch } from "../models/Batch.js";
import { FeedbackLoop } from "../models/FeedbackLoop.js";
import { ResearchDoc } from "../models/ResearchDoc.js";
import { Idea } from "../models/Idea.js";
import { slugify } from "../utils/slug.js";

function genLegacyId() {
  return crypto.randomBytes(8).toString("hex");
}

/** Resolve brand by Mongo id or by name (creates if missing). */
export async function resolveBrand({ brandId, brandName }) {
  if (brandId && mongoose.isValidObjectId(brandId)) {
    const b = await Brand.findById(brandId);
    if (b) return b;
  }
  const name = (brandName || "OriginDrops").trim();
  const slug = slugify(name);
  let brand = await Brand.findOne({ slug });
  if (!brand) {
    brand = await Brand.create({
      name,
      slug,
      isDefault: slug === "origindrops",
    });
  }
  return brand;
}

function bulkStats(result) {
  return {
    matched: result.matchedCount ?? 0,
    modified: result.modifiedCount ?? 0,
    upserted: result.upsertedCount ?? 0,
  };
}

/**
 * Upserts entities from backup JSON. Uses legacy `id` as stable key per brand.
 */
export async function importBackupJson(data, brandDoc) {
  const brandId = brandDoc._id;

  const has = (k) => Object.prototype.hasOwnProperty.call(data, k);
  const batches = has("batches")
    ? Array.isArray(data.batches)
      ? data.batches
      : []
    : null;
  const loops = has("loops")
    ? Array.isArray(data.loops)
      ? data.loops
      : []
    : null;
  const docs = has("docs")
    ? Array.isArray(data.docs)
      ? data.docs
      : []
    : null;
  const ideas = has("ideas")
    ? Array.isArray(data.ideas)
      ? data.ideas
      : []
    : null;

  const batchOps = (batches || []).map((raw) => {
    const legacyId = raw.id || genLegacyId();
    const payload = { ...raw, id: legacyId, brandId };
    return {
      updateOne: {
        filter: { brandId, id: legacyId },
        update: { $set: payload },
        upsert: true,
      },
    };
  });

  const loopOps = (loops || []).map((raw) => {
    const legacyId = raw.id || genLegacyId();
    const payload = { ...raw, id: legacyId, brandId };
    return {
      updateOne: {
        filter: { brandId, id: legacyId },
        update: { $set: payload },
        upsert: true,
      },
    };
  });

  const docOps = (docs || []).map((raw) => {
    const legacyId = raw.id || genLegacyId();
    const payload = { ...raw, id: legacyId, brandId };
    return {
      updateOne: {
        filter: { brandId, id: legacyId },
        update: { $set: payload },
        upsert: true,
      },
    };
  });

  const ideaOps = (ideas || []).map((raw) => {
    const legacyId = raw.id || genLegacyId();
    const payload = { ...raw, id: legacyId, brandId };
    return {
      updateOne: {
        filter: { brandId, id: legacyId },
        update: { $set: payload },
        upsert: true,
      },
    };
  });

  const stats = {};

  if (batches !== null) {
    if (batchOps.length) {
      const r = await Batch.bulkWrite(batchOps, { ordered: false });
      stats.batches = bulkStats(r);
    } else stats.batches = { matched: 0, modified: 0, upserted: 0 };
  } else stats.batches = { skipped: true };

  if (loops !== null) {
    if (loopOps.length) {
      const r = await FeedbackLoop.bulkWrite(loopOps, { ordered: false });
      stats.loops = bulkStats(r);
    } else stats.loops = { matched: 0, modified: 0, upserted: 0 };
  } else stats.loops = { skipped: true };

  if (docs !== null) {
    if (docOps.length) {
      const r = await ResearchDoc.bulkWrite(docOps, { ordered: false });
      stats.docs = bulkStats(r);
    } else stats.docs = { matched: 0, modified: 0, upserted: 0 };
  } else stats.docs = { skipped: true };

  if (ideas !== null) {
    if (ideaOps.length) {
      const r = await Idea.bulkWrite(ideaOps, { ordered: false });
      stats.ideas = bulkStats(r);
    } else stats.ideas = { matched: 0, modified: 0, upserted: 0 };
  } else stats.ideas = { skipped: true };

  return {
    brand: {
      id: String(brandDoc._id),
      name: brandDoc.name,
      slug: brandDoc.slug,
    },
    stats,
    exportDate: data.exportDate || null,
  };
}
