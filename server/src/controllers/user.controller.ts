import { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User.model";
import FormResponse from "../models/FormResponse.model";
import Form from "../models/Form.model";
import SystemSettings from "../models/SystemSettings.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../errors/AppError";
import {
  formatHour,
  buildDateRangeFilter,
  buildSafeRegex,
} from "../utils/helper.utils";
import { UserRole, FormStatus, UserStatus } from "@poc-admin-form/shared";
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

    let query: any = { status: UserStatus.ACTIVE };

    if (search) {
      const safePattern = buildSafeRegex(search);
      query = {
        $and: [
          { status: UserStatus.ACTIVE },
          {
            $or: [
              { email: { $regex: safePattern } },
              { name: { $regex: safePattern } },
              { employeeId: { $regex: safePattern } },
              { vendorId: { $regex: safePattern } },
            ],
          },
        ],
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
    const user = await User.findOne({ _id: id, status: UserStatus.ACTIVE })
      .select("-password")
      .lean();

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

    // RULE 1: SuperAdmin cannot create another SuperAdmin
    if (finalRole === UserRole.SUPERADMIN) {
      throw AppError.forbidden("SuperAdmin role cannot be created");
    }

    // RULE 2: Admins can only create USER role, Super Admins can create USER and ADMIN
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

    if (user.status === UserStatus.DELETED) {
      throw AppError.notFound("User not found");
    }

    // RULE 1: SuperAdmin cannot edit another SuperAdmin
    if (
      user.role === UserRole.SUPERADMIN &&
      currentUser?.role === UserRole.SUPERADMIN
    ) {
      throw AppError.forbidden("SuperAdmin cannot edit another SuperAdmin");
    }

    // RULE 2: Admin cannot edit Admin or SuperAdmin
    if (currentUser?.role === UserRole.ADMIN) {
      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
        throw AppError.forbidden(
          "Admin cannot edit other Admins or SuperAdmins"
        );
      }
    }

    // RULE 3: Role updates - SuperAdmin cannot set role to SUPERADMIN, Admin cannot set role to ADMIN or SUPERADMIN
    if (role !== undefined) {
      if (role === UserRole.SUPERADMIN) {
        throw AppError.forbidden("Cannot change role to SuperAdmin");
      }
      if (currentUser?.role === UserRole.ADMIN && role === UserRole.ADMIN) {
        throw AppError.forbidden("Admin cannot change role to Admin");
      }
    }

    // RULE 4: EmployeeId, VendorId, City permissions
    // SuperAdmin can edit for everyone, Admin can edit for USER role only
    // City can be edited by SuperAdmin for everyone (except SuperAdmin), Admin can edit for USER role only
    if (employeeId !== undefined || vendorId !== undefined || city !== undefined) {
      if (currentUser?.role === UserRole.ADMIN) {
        // Admin can only edit employeeId/vendorId for USER role
        if (user.role !== UserRole.USER) {
          throw AppError.forbidden(
            "Admin can only edit employeeId, vendorId and city for User role"
          );
        }
      } else if (currentUser?.role !== UserRole.SUPERADMIN) {
        // Regular users cannot edit these fields
        throw AppError.forbidden(
          "Only admins can edit employeeId, vendorId and city"
        );
      }
    }

    // RULE 5: Module permissions - only SuperAdmin can set
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
    // EmployeeId and VendorId can be edited by SuperAdmin (for all) or Admin (for USER role only)
    if (employeeId !== undefined) {
      if (
        currentUser?.role === UserRole.SUPERADMIN ||
        (currentUser?.role === UserRole.ADMIN && user.role === UserRole.USER)
      ) {
        user.employeeId = employeeId;
      }
    }
    if (vendorId !== undefined) {
      if (
        currentUser?.role === UserRole.SUPERADMIN ||
        (currentUser?.role === UserRole.ADMIN && user.role === UserRole.USER)
      ) {
        user.vendorId = vendorId;
      }
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
    const userId = req.user!.userId;
    const { address, city } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (user.status === UserStatus.DELETED) {
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
 * Soft delete user (sets status=deleted)
 * RBAC:
 * - SUPERADMIN cannot delete another SUPERADMIN
 * - ADMIN cannot delete ADMIN/SUPERADMIN
 */
export const deleteUser = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user;

    if (!currentUser) {
      throw AppError.unauthorized("Not authorized");
    }

    const user = await User.findById(id);
    if (!user || user.status === UserStatus.DELETED) {
      throw AppError.notFound("User not found");
    }

    if (currentUser.role === UserRole.SUPERADMIN) {
      if (user.role === UserRole.SUPERADMIN) {
        throw AppError.forbidden("SuperAdmin cannot delete another SuperAdmin");
      }
    } else if (currentUser.role === UserRole.ADMIN) {
      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
        throw AppError.forbidden("Admin cannot delete Admins or SuperAdmins");
      }
    } else {
      throw AppError.forbidden("Admin access required");
    }

    user.status = UserStatus.DELETED;
    await user.save();

    res.json({ message: "User deleted successfully" });
  }
);

/**
 * Get user submission count with time filter
 */
export const getUserSubmissionCount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const userId = new mongoose.Types.ObjectId(id);
    const dateFilter = buildDateRangeFilter(startDate, endDate, "submittedAt");

    const count = await FormResponse.countDocuments({
      userId,
      ...dateFilter,
    });

    res.json({ count, startDate, endDate });
  }
);

/**
 * Get user analytics (for user profile page)
 */
export const getUserAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    if (req.user?.role === UserRole.USER && id !== userId) {
      throw AppError.forbidden(
        "You are not authorized to access this user's analytics"
      );
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const submittedAtFilter = buildDateRangeFilter(
      startDate,
      endDate,
      "submittedAt"
    );

    const userObjectId = new mongoose.Types.ObjectId(id);

    const userRecord = await User.findOne({
      _id: userObjectId,
      status: UserStatus.ACTIVE,
    })
      .select("_id")
      .lean();
    if (!userRecord) {
      throw AppError.notFound("User not found");
    }

    // Get response count for time period
    const responseCount = await FormResponse.countDocuments({
      userId: userObjectId.toString(),
      ...submittedAtFilter,
    });

    // Get unique forms responded to (unaffected by time filter)
    const uniqueForms = await FormResponse.distinct("formId", {
      userId: userObjectId.toString(),
    });

    // Get total submissions (unaffected by time filter)
    const totalSubmissions = await FormResponse.countDocuments({
      userId: userObjectId.toString(),
    });

    res.json({
      responseCount,
      formsRespondedTo: uniqueForms.length,
      totalSubmissions,
      startDate,
      endDate,
    });
  }
);

/**
 * Get user submissions breakdown per form
 */
export const getUserSubmissionsBreakdown = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Authorization check: users can only see their own data, admins can see any user
    if (req.user?.role === UserRole.USER && id !== userId) {
      throw AppError.forbidden(
        "You are not authorized to access this user's data"
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(id);

    const userRecord = await User.findOne({
      _id: userObjectId,
      status: UserStatus.ACTIVE,
    })
      .select("_id")
      .lean();
    if (!userRecord) {
      throw AppError.notFound("User not found");
    }

    // Aggregate submissions grouped by formId with form details
    const submissionsBreakdown = await FormResponse.aggregate([
      {
        $match: {
          userId: userObjectId, // Match as ObjectId, not string
        },
      },
      {
        $group: {
          _id: "$formId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "forms",
          localField: "_id", // _id is already ObjectId (formId)
          foreignField: "_id",
          as: "formDetails",
        },
      },
      {
        $unwind: "$formDetails",
      },
      {
        $project: {
          _id: 0,
          formId: "$_id",
          formTitle: "$formDetails.title",
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.json({
      data: submissionsBreakdown,
      total: submissionsBreakdown.reduce((acc, item) => acc + item.count, 0),
    });
  }
);

/**
 * Get admin analytics (for admin dashboard)
 */
export const getAdminAnalytics = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // Get system settings for heartbeat window
    const settings = await SystemSettings.getSettings();
    const heartbeatWindowHours = settings.heartbeat_window;
    const heartbeatThreshold = new Date(
      Date.now() - heartbeatWindowHours * 60 * 60 * 1000
    );

    // Count currently active users (within heartbeat window)
    const activeUsersCount = await User.countDocuments({
      lastHeartbeat: { $gte: heartbeatThreshold },
      status: UserStatus.ACTIVE,
    });

    // Count draft forms
    const draftFormsCount = await Form.countDocuments({
      status: { $ne: FormStatus.PUBLISHED },
    });

    // Calculate peak activity hours based on heartbeat data
    const peakActivityHours = await calculatePeakActivityHours(
      heartbeatWindowHours
    );

    res.json({
      activeUsersCount,
      draftFormsCount,
      peakActivityHours,
      heartbeatWindowHours,
    });
  }
);

/**
 * Helper function to calculate peak activity hours
 */
async function calculatePeakActivityHours(
  windowHours: number
): Promise<string> {
  // Aggregate heartbeat data by hour of day
  const hourlyActivity = await User.aggregate([
    {
      $match: {
        lastHeartbeat: { $exists: true, $ne: null },
        status: UserStatus.ACTIVE,
      },
    },
    {
      $project: {
        hour: { $hour: { date: "$lastHeartbeat", timezone: "Asia/Kolkata" } },
      },
    },
    {
      $group: {
        _id: "$hour",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 1,
    },
  ]);

  if (hourlyActivity.length === 0) {
    return "No activity data";
  }

  const peakHour = hourlyActivity[0]._id;

  // Format the result based on window size
  if (windowHours === 1) {
    // Single hour format
    const endHour = (peakHour + 1) % 24;
    return `${formatHour(peakHour)} - ${formatHour(endHour)}`;
  } else {
    // Range format based on window
    const startHour = Math.max(0, peakHour - Math.floor(windowHours / 2));
    const endHour = Math.min(23, startHour + Math.floor(windowHours));
    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
  }
}
