import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import User from "../models/User.model";
import SystemSettings from "../models/SystemSettings.model";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../errors/AppError.ts";

/**
 * Heartbeat middleware - MUST be placed AFTER authenticate middleware
 * Updates lastHeartbeat timestamp on authenticated requests
 */
export const heartbeat = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Only update if user is authenticated
    if (!req.user || !req.user.userId) {
      return next();
    }

    try {
      // Update lastHeartbeat asynchronously (don't block request)
      User.findByIdAndUpdate(
        req.user.userId,
        { lastHeartbeat: new Date() },
        { new: true }
      ).catch((err) => {
        // Log error but don't fail the request
        throw AppError.internal("Failed to update heartbeat");
      });
    } catch (error) {
      // Log error but don't fail the request
      throw AppError.internal("Heartbeat middleware error");
    }
    next();
  }
);

/**
 * Get heartbeat window in milliseconds from SystemSettings
 */
export const getHeartbeatWindow = asyncHandler(async (): Promise<number> => {
  try {
    const settings = await SystemSettings.getSettings();
    return settings.heartbeat_window * 60 * 60 * 1000;
  } catch (error) {
    // Fallback to default from env or 1 hour
    const defaultHours = parseFloat(process.env.HEARTBEAT_WINDOW || "1");
    return defaultHours * 60 * 60 * 1000;
  }
});
