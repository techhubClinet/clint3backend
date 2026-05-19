import { Router } from "express";
import { body, validationResult } from "express-validator";
import { Brand } from "../models/Brand.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { requireAuth } from "../middleware/auth.js";
import { slugify } from "../utils/slug.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const brands = await Brand.find().sort({ sortOrder: 1, name: 1 }).lean();
    res.json(
      brands.map((b) => ({
        id: String(b._id),
        name: b.name,
        slug: b.slug,
        isDefault: b.isDefault,
        sortOrder: b.sortOrder,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }))
    );
  })
);

router.post(
  "/",
  body("name").trim().notEmpty().isLength({ max: 200 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);
    const name = req.body.name.trim();
    let slug = slugify(name);
    const exists = await Brand.findOne({ slug });
    if (exists) throw new AppError("A brand with this name already exists", 409);
    const maxOrder = await Brand.findOne().sort({ sortOrder: -1 }).select("sortOrder");
    const sortOrder = (maxOrder?.sortOrder ?? 0) + 1;
    const brand = await Brand.create({ name, slug, sortOrder });
    res.status(201).json({
      id: String(brand._id),
      name: brand.name,
      slug: brand.slug,
      isDefault: brand.isDefault,
      sortOrder: brand.sortOrder,
    });
  })
);

router.patch(
  "/:brandId",
  body("name").optional().trim().notEmpty(),
  body("sortOrder").optional().isInt(),
  asyncHandler(async (req, res) => {
    const brand = await Brand.findById(req.params.brandId);
    if (!brand) throw new AppError("Brand not found", 404);
    if (req.body.name) {
      brand.name = req.body.name.trim();
      brand.slug = slugify(brand.name);
    }
    if (req.body.sortOrder !== undefined) brand.sortOrder = req.body.sortOrder;
    await brand.save();
    res.json({
      id: String(brand._id),
      name: brand.name,
      slug: brand.slug,
      sortOrder: brand.sortOrder,
    });
  })
);

router.delete(
  "/:brandId",
  asyncHandler(async (req, res) => {
    const { Batch } = await import("../models/Batch.js");
    const { FeedbackLoop } = await import("../models/FeedbackLoop.js");
    const { ResearchDoc } = await import("../models/ResearchDoc.js");
    const { Idea } = await import("../models/Idea.js");
    const id = req.params.brandId;
    const r = await Brand.findByIdAndDelete(id);
    if (!r) throw new AppError("Brand not found", 404);
    await Promise.all([
      Batch.deleteMany({ brandId: id }),
      FeedbackLoop.deleteMany({ brandId: id }),
      ResearchDoc.deleteMany({ brandId: id }),
      Idea.deleteMany({ brandId: id }),
    ]);
    res.status(204).send();
  })
);

export default router;
