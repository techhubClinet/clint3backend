import jwt from "jsonwebtoken";
import { settings } from "../config/settings.js";

export function signToken(payload) {
  const secret = settings.jwtSecret;
  if (!secret) throw new Error("jwtSecret is not configured in settings.js");
  return jwt.sign(payload, secret, {
    expiresIn: settings.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  const secret = settings.jwtSecret;
  if (!secret) throw new Error("jwtSecret is not configured in settings.js");
  return jwt.verify(token, secret);
}
