import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserProfile,
  getUserSubmissionCount,
} from "../controllers/user.controller";
import {
  authenticate,
  authorize,
  authorizeModule,
} from "../middlewares/auth.middleware";
import { heartbeat } from "../middlewares/heartbeat.middleware";
import { UserRole } from "@poc-admin-form/shared";

const router = express.Router();

// Specific routes MUST come before parameterized routes (/:id)

// User profile update route (no module check needed)
router.put("/profile", authenticate, heartbeat, updateUserProfile);

// Admin routes: authenticate → heartbeat → authorize([ADMIN, SUPERADMIN]) → authorizeModule('users')
router.get(
  "/",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  getUsers
);

router.post(
  "/",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  createUser
);

// Parameterized routes come AFTER specific routes
router.get("/:id", authenticate, heartbeat, getUserById);

router.put(
  "/:id",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  updateUser
);

router.get(
  "/:id/activity",
  authenticate,
  heartbeat,
  authorize([UserRole.ADMIN, UserRole.SUPERADMIN]),
  authorizeModule("users"),
  getUserSubmissionCount
);

export default router;
