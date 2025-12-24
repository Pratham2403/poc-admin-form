import { Request, Response } from "express";
import User from "../models/User.model.ts";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.utils.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../errors/AppError.ts";
import { AuthRequest } from "../middlewares/auth.middleware.ts";
import { UserRole } from "@poc-admin-form/shared";

/**
 * Register a new user
 * Only super admin can set modulePermissions
 */
export const register = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      email,
      password,
      name,
      role,
      address,
      city,
      employeeId,
      vendorId,
      modulePermissions,
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      throw AppError.badRequest("User already exists");
    }

    // Use provided password or default to "password123"
    const userPassword = password || "password123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    // Only super admin can set modulePermissions
    const currentUser = req.user;
    let finalModulePermissions = undefined;

    if (modulePermissions) {
      if (currentUser?.role !== UserRole.SUPERADMIN) {
        throw AppError.forbidden("Only super admin can set module permissions");
      }

      // Validate module permissions structure
      if (
        typeof modulePermissions !== "object" ||
        typeof modulePermissions.users !== "boolean" ||
        typeof modulePermissions.forms !== "boolean"
      ) {
        throw AppError.badRequest(
          "Invalid module permissions structure. Must be { users: boolean, forms: boolean }"
        );
      }

      finalModulePermissions = modulePermissions;
    }

    await User.create({
      email,
      password: hashedPassword,
      name,
      role: role || UserRole.USER,
      address,
      city,
      employeeId,
      vendorId,
      modulePermissions: finalModulePermissions,
    });

    res.status(201).json({
      message: `User ${name} created successfully`,
      success: true,
    });
  }
);

/**
 * Login a user
 * This will set the access and refresh tokens in the cookies
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (
    user &&
    user.password &&
    (await bcrypt.compare(password, user.password))
  ) {
    const accessToken = generateAccessToken(
      user._id.toString(),
      user.role,
      user.modulePermissions
    );
    const refreshToken = generateRefreshToken(user._id.toString());

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      modulePermissions: user.modulePermissions,
    });
  } else {
    throw AppError.unauthorized("Invalid email or password");
  }
});

/**
 * Logout a user
 * This will clear the access and refresh tokens from the cookies
 */
export const logout = (_req: Request, res: Response) => {
  res.cookie("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    expires: new Date(0),
  });
  res.cookie("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
};

/**
 * Refresh a user's access token
 * This will generate a new access token and set it in the cookies
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw AppError.unauthorized("Not authorized, no refresh token");
  }

  const decoded = verifyRefreshToken(refreshToken) as any;

  // Update lastHeartbeat on token refresh (user activity)
  const user = await User.findByIdAndUpdate(
    decoded.userId,
    { lastHeartbeat: new Date() },
    { new: true }
  );
  if (!user) throw AppError.unauthorized("User not found");

  const accessToken = generateAccessToken(
    user._id.toString(),
    user.role,
    user.modulePermissions
  );
  const newRefreshToken = generateRefreshToken(user._id.toString());

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Replace the old refresh token with the new one so that the user can't use the old refresh token to get a new access token
  // This is a security measure to prevent the user from using the old refresh token to get a new access token
  res.cookie("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    message: "Token refreshed",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      modulePermissions: user.modulePermissions,
    },
  });
});

/**
 * Get CSRF token
 */
export const getCSRFToken = (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken });
};
