import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User.model";
import FormResponse from "../models/FormResponse.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../errors/AppError";
import { UserRole } from "@poc-admin-form/shared";
import bcrypt from "bcryptjs";
/**
 * Get all users with pagination and search
 */
export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    let query: any = {};

    if (search) {
      query = {
        $or: [
          { email: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
          { vendorId: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");

    if (!user) {
      throw AppError.notFound("User not found");
    }

    res.json(user);
  }
);

/**
 * Create a new user
 */
export const createUser = asyncHandler(
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

    // Only super admin can create ADMIN users and set modulePermissions
    const currentUser = req.user;
    let finalRole = role || UserRole.USER;
    let finalModulePermissions = undefined;

    // Admins can only create USER role, Super Admins can create both USER and ADMIN
    if (currentUser?.role !== UserRole.SUPERADMIN) {
      if (finalRole === UserRole.ADMIN) {
        throw AppError.forbidden("Only super admin can create admin users");
      }
      finalRole = UserRole.USER; // Force USER role for regular admins
    }

    // Only super admin can set modulePermissions (and only for ADMIN role)
    if (modulePermissions) {
      if (currentUser?.role !== UserRole.SUPERADMIN) {
        throw AppError.forbidden("Only super admin can set module permissions");
      }

      if (finalRole !== UserRole.ADMIN) {
        throw AppError.badRequest(
          "Module permissions can only be set for admin users"
        );
      }

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

    // Use provided password or default to "password123"
    const userPassword = password || "password123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    // Address and city are not set during creation - users will add them in their profile
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: finalRole,
      employeeId,
      vendorId,
      modulePermissions: finalModulePermissions,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  }
);

/**
 * Update user (admin only, with field restrictions)
 */
export const updateUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user;
    const {
      name,
      email,
      role,
      address,
      city,
      employeeId,
      vendorId,
      modulePermissions,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Only super admin can edit employeeId, vendorId, and modulePermissions
    if (currentUser?.role !== UserRole.SUPERADMIN) {
      if (
        employeeId !== undefined ||
        vendorId !== undefined ||
        modulePermissions !== undefined
      ) {
        throw AppError.forbidden(
          "Only super admin can edit employeeId, vendorId, and modulePermissions"
        );
      }
    }

    // Only super admin can set modulePermissions
    if (modulePermissions) {
      if (currentUser?.role !== UserRole.SUPERADMIN) {
        throw AppError.forbidden("Only super admin can set module permissions");
      }

      if (
        typeof modulePermissions !== "object" ||
        typeof modulePermissions.users !== "boolean" ||
        typeof modulePermissions.forms !== "boolean"
      ) {
        throw AppError.badRequest(
          "Invalid module permissions structure. Must be { users: boolean, forms: boolean }"
        );
      }
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined && currentUser?.role === UserRole.SUPERADMIN) {
      user.role = role;
    }
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (employeeId !== undefined && currentUser?.role === UserRole.SUPERADMIN) {
      user.employeeId = employeeId;
    }
    if (vendorId !== undefined && currentUser?.role === UserRole.SUPERADMIN) {
      user.vendorId = vendorId;
    }
    if (
      modulePermissions !== undefined &&
      currentUser?.role === UserRole.SUPERADMIN
    ) {
      user.modulePermissions = modulePermissions;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  }
);

/**
 * Update user's own profile (address, city only)
 */
export const updateUserProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.userId;
    const { address, city } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  }
);

/**
 * Get user submission count with time filter
 */
export const getUserSubmissionCount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const timeFilter = (req.query.timeFilter as string) || "all"; // today, month, all

    const userId = new mongoose.Types.ObjectId(id);
    let dateFilter: any = {};

    if (timeFilter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { submittedAt: { $gte: startOfDay } };
    } else if (timeFilter === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { submittedAt: { $gte: startOfMonth } };
    }

    const count = await FormResponse.countDocuments({
      userId,
      ...dateFilter,
    });

    res.json({ count, timeFilter });
  }
);

