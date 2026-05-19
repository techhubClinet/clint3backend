import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { importBackupJson, resolveBrand } from "../services/importService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth);

function optionalUpload(req, res, next) {
  if (req.is("multipart/form-data")) {
    return upload.single("file")(req, res, next);
  }
  return next();
}

/**
 * Import JSON backup: multipart field `file` OR raw JSON body.
 * Brand scope: `?brandId=` or `?brandName=` (default OriginDrops).
 */
router.post(
  "/json",
  optionalUpload,
  asyncHandler(async (req, res) => {
    let data;
    if (req.file) {
      try {
        data = JSON.parse(req.file.buffer.toString("utf8"));
      } catch {
        throw new AppError("Invalid JSON file", 400);
      }
    } else if (req.is("application/json") && req.body && typeof req.body === "object") {
      data = req.body;
    } else {
      throw new AppError(
        "Send a JSON file as multipart field `file` or POST JSON body",
        400
      );
    }

    if (!data || typeof data !== "object") {
      throw new AppError("Invalid backup payload", 400);
    }

    const brandId = req.query.brandId || req.body.brandId;
    const brandName = req.query.brandName || req.body.brandName;

    const brand = await resolveBrand({ brandId, brandName });
    const result = await importBackupJson(data, brand);
    res.json({
      ok: true,
      message: "Import completed",
      ...result,
    });
  })
);

export default router;
