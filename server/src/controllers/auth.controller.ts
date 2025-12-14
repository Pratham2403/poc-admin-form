import { Request, Response } from "express";
import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.utils.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../errors/AppError.js";

/**
 * Registers a new user.
 * It creates a new user document.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw AppError.badRequest("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await User.create({
    email,
    password: hashedPassword,
    name,
    role,
  });

  res.status(201).json({
    message: `User ${name} created successfully`,
    success: true,
  });
});

/**
 * Logs in a user.
 * It validates the user credentials, generates access and refresh tokens, and sets cookies.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password))
  ) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString());

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

/**
 * Logs out a user.
 * It clears the access and refresh tokens from the cookies.
 */
export const logout = (_req: Request, res: Response) => {
  res.cookie("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });
  res.cookie("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * Refreshes a user's access token.
 * It validates the refresh token, generates a new access token, and sets the new access token in the cookies.
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw AppError.unauthorized("Not authorized, no refresh token");
  }

  const decoded = verifyRefreshToken(refreshToken) as any;
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw AppError.unauthorized("User not found");
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.json({
    message: "Token refreshed",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

/**
 * Gets a CSRF token.
 * It returns a CSRF token.
 */
export const getCSRFToken = (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken });
};
