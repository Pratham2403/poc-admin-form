import { Request, Response, NextFunction } from 'express';
import { validateAndInitializeSheet } from '../services/googleSheets.service.js';

export const validateSheetAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { googleSheetUrl } = req.body;

        // If no URL provided, proceed (it might be optional or handled elsewhere, 
        // essentially we only validate if a URL is actually provided)
        if (!googleSheetUrl) {
            return next();
        }

        // Validate using the service
        // This keeps the logic centralized in the service as per requirements
        await validateAndInitializeSheet(googleSheetUrl);

        next();
    } catch (error: any) {
        // Log only the message to keep console clean, as the service has already handled detailed logging/warnings if needed
        console.error('Sheet validation middleware error:', error.message);

        // Return 400 for validation errors so the frontend can display them to the user
        res.status(400).json({
            message: error.message || 'Failed to validate Google Sheet access'
        });
    }
};
