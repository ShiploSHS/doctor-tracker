import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User } from "../users/user.model";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many login attempts. Try again later." },
  },
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ success: true, data: { message: "Logged out" } });
});

router.get("/me", authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
