import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

export function parseBrandId(paramName = "brandId") {
  return (req, res, next) => {
    const raw = req.params[paramName];
    if (!mongoose.isValidObjectId(raw)) {
      throw new AppError("Invalid brand id", 400);
    }
    req.brandObjectId = raw;
    next();
  };
}
