import { Request, Response, NextFunction } from "express";
import { validateAndInitializeSheet } from "../services/googleSheets.service.js";
import { AppError } from "../errors/AppError.js";

export const validateSheetAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { googleSheetUrl } = req.body;

    if (!googleSheetUrl) {
      return next(AppError.badRequest("Google Sheets URL is required"));
    }

    await validateAndInitializeSheet(googleSheetUrl);
    next();
  } catch (error: any) {
    // Pass to error middleware for consistent handling
    next(
      AppError.badRequest(
        error.message || "Failed to validate Google Sheet access"
      )
    );
  }
};
