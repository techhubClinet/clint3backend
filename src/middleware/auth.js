import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    throw new AppError("Authentication required", 401);
  }
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
});
