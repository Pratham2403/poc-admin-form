import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserProfile,
  getUserSubmissionCount,
  getUserAnalytics,
  getAdminAnalytics,
} from "../controllers/user.controller";
import {
  authenticate,
  authorize,
  authorizeModule,
} from "../middlewares/auth.middleware";
import { heartbeat } from "../middlewares/heartbeat.middleware";
import { UserRole } from "@poc-admin-form/shared";

const router = express.Router();

/**
 * Update User Profile
 */
router.put("/profile", authenticate, heartbeat, updateUserProfile);

/**
 * Get user analytics (for profile page)
 * Accessible by the user themselves
 */
router.get("/analytics/me", authenticate, heartbeat, getUserAnalytics);

/**
 * Get admin analytics (for admin dashboard)
 * Accessible SUPERADMIN and ADMIN
 */
router.get(
  "/analytics/admin",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  getAdminAnalytics
);

/*
 * Get all users with pagination and search
 * Accessible SUPERADMIN and ADMIN with 'users' module permission
 */
router.get(
  "/",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  getUsers
);

/*
 * Create a new user
 * Accessible SUPERADMIN and ADMIN with 'users' module permission
 */
router.post(
  "/",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  createUser
);

/*
 * Get user by ID
 */
router.get("/:id", authenticate, heartbeat, getUserById);

/*
 * Update user by ID
 * Accessible SUPERADMIN and ADMIN with 'users' module permission
 */
router.put(
  "/:id",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  updateUser
);

/*
 * Get user activity (submission count)
 * Accessible SUPERADMIN and ADMIN with 'users' module permission
 */
router.get(
  "/:id/activity",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  getUserSubmissionCount
);

export default router;
