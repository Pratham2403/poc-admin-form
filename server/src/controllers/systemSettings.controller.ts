import { Response } from "express";
import SystemSettings from "../models/SystemSettings.model";
import { AuthRequest } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../errors/AppError";

/**
 * Get current system settings
 */
export const getSettings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const settings = await SystemSettings.getSettings();
    res.json(settings);
  }
);

/**
 * Update system settings
 */
export const updateSettings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { heartbeat_window } = req.body;

    if (heartbeat_window !== undefined) {
      if (typeof heartbeat_window !== "number" || heartbeat_window <= 0) {
        throw AppError.badRequest(
          "heartbeat_window must be a positive number"
        );
      }
    }

    const settings = await SystemSettings.updateSettings({
      heartbeat_window,
    });

    res.json(settings);
  }
);

