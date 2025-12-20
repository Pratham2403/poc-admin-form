import { Request, Response, NextFunction } from "express";
import { validateAndInitializeSheet } from "../services/googleSheets.service.ts";
import { AppError } from "../errors/AppError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const validateSheetAccess = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { googleSheetUrl } = req.body;
    // Skip validation for status-only updates or other field updates
    if (googleSheetUrl !== undefined) {
      if (!googleSheetUrl) {
        return next(AppError.badRequest("Google Sheet URL is required"));
      }
      await validateAndInitializeSheet(googleSheetUrl);
    }
    next();
  }
);
