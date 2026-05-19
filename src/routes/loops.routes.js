import { Router } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import { FeedbackLoop } from "../models/FeedbackLoop.js";
import { Brand } from "../models/Brand.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { toClientLoop } from "../utils/serialize.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { brandId } = req.params;
    if (!mongoose.isValidObjectId(brandId)) throw new AppError("Invalid brand id", 400);
    const brand = await Brand.findById(brandId);
    if (!brand) throw new AppError("Brand not found", 404);
    const rows = await FeedbackLoop.find({ brandId }).lean();
    res.json(rows.map(toClientLoop));
  })
);

router.get(
  "/:legacyId",
  asyncHandler(async (req, res) => {
    const { brandId, legacyId } = req.params;
    if (!mongoose.isValidObjectId(brandId)) throw new AppError("Invalid brand id", 400);
    const doc = await FeedbackLoop.findOne({ brandId, id: legacyId }).lean();
    if (!doc) throw new AppError("Feedback loop not found", 404);
    res.json(toClientLoop(doc));
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { brandId } = req.params;
    if (!mongoose.isValidObjectId(brandId)) throw new AppError("Invalid brand id", 400);
    const brand = await Brand.findById(brandId);
    if (!brand) throw new AppError("Brand not found", 404);
    const legacyId = req.body.id || crypto.randomBytes(8).toString("hex");
    const exists = await FeedbackLoop.findOne({ brandId, id: legacyId });
    if (exists) throw new AppError("Record with this id already exists", 409);
    const payload = { ...req.body, id: legacyId, brandId };
    const created = await FeedbackLoop.create(payload);
    res.status(201).json(toClientLoop(created));
  })
);

router.put(
  "/:legacyId",
  asyncHandler(async (req, res) => {
    const { brandId, legacyId } = req.params;
    if (!mongoose.isValidObjectId(brandId)) throw new AppError("Invalid brand id", 400);
    const doc = await FeedbackLoop.findOne({ brandId, id: legacyId });
    if (!doc) throw new AppError("Feedback loop not found", 404);
    const next = { ...doc.toObject(), ...req.body, id: legacyId, brandId: doc.brandId };
    await FeedbackLoop.replaceOne({ _id: doc._id }, next);
    const updated = await FeedbackLoop.findById(doc._id);
    res.json(toClientLoop(updated));
  })
);

router.patch(
  "/:legacyId",
  asyncHandler(async (req, res) => {
    const { brandId, legacyId } = req.params;
    if (!mongoose.isValidObjectId(brandId)) throw new AppError("Invalid brand id", 400);
    const doc = await FeedbackLoop.findOneAndUpdate(
      { brandId, id: legacyId },
      { $set: { ...req.body, id: legacyId } },
      { new: true }
    );
    if (!doc) throw new AppError("Feedback loop not found", 404);
    res.json(toClientLoop(doc));
  })
);

router.delete(
  "/:legacyId",
  asyncHandler(async (req, res) => {
    const { brandId, legacyId } = req.params;
    if (!mongoose.isValidObjectId(brandId)) throw new AppError("Invalid brand id", 400);
    const r = await FeedbackLoop.findOneAndDelete({ brandId, id: legacyId });
    if (!r) throw new AppError("Feedback loop not found", 404);
    res.status(204).send();
  })
);

export default router;
