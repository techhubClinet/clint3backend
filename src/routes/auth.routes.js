import { Router } from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many login attempts" },
});

router.post(
  "/register",
  loginLimiter,
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 10 }),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }
    const count = await User.countDocuments();
    if (count > 0) {
      throw new AppError("Registration is disabled", 403);
    }
    const { email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });
    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  })
);

router.post(
  "/login",
  loginLimiter,
  body("email").isEmail().normalizeEmail(),
  body("password").isString().notEmpty(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError("Invalid credentials", 400);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError("Invalid email or password", 401);
    }
    const token = signToken({ sub: user.id, email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError("User not found", 404);
    res.json({ id: user.id, email: user.email, role: user.role });
  })
);

export default router;
