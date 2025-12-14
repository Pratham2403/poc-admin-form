import { Response } from "express";
import Form from "../models/Form.model.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { FormStatus } from "@poc-admin-form/shared";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../errors/AppError.js";

/**
 * Creates a new form.
 * It creates a new form document.
 */
export const createForm = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const form = await Form.create({
      ...req.body,
      createdBy: req.user.userId,
    });
    res.status(201).json(form);
  }
);

/**
 * Gets all forms.
 * It returns all forms.
 */
export const getForms = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const skip = (page - 1) * limit;

    let query: any = {};

    if (userId) {
      query = {
        $or: [
          { createdBy: userId, status: { $ne: FormStatus.DELETED } },
          { status: FormStatus.PUBLISHED },
        ],
      };
    } else {
      query = {
        status: FormStatus.PUBLISHED,
        isPublic: true,
      };
    }

    const [forms, total] = await Promise.all([
      Form.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Form.countDocuments(query),
    ]);

    res.json({
      data: forms,
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
 * Gets a form by its ID.
 * It returns the form by its ID.
 * It also populates the form data.
 * It also checks if the user is authorized to view the form.
 * If the user is not authorized, it throws an error.
 */
export const getFormById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const form = await Form.findOne({
      _id: id,
      status: { $ne: FormStatus.DELETED },
    });

    if (!form) {
      throw AppError.notFound("Form not found");
    }

    // Anonymous user
    if (!userId) {
      if (form.isPublic && form.status === FormStatus.PUBLISHED) {
        return res.json(form);
      }
      throw AppError.unauthorized("You must be logged in to view this form.");
    }

    // Creator can view their own form
    if (form.createdBy.toString() === userId) {
      return res.json(form);
    }

    // Others can only view published forms
    if (form.status === FormStatus.PUBLISHED) {
      return res.json(form);
    }

    throw AppError.forbidden(
      "Not authorized to view this form (Form is not published)"
    );
  }
);

/**
 * Updates a form.
 * It updates the form document.
 * It also checks if the user is authorized to update the form.
 * If the user is not authorized, it throws an error.
 */
export const updateForm = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      req.body,
      { new: true }
    );

    if (!form) {
      throw AppError.notFound("Form not found or unauthorized");
    }

    res.json(form);
  }
);

/**
 * Deletes a form.
 * It deletes the form document.
 * It also checks if the user is authorized to delete the form.
 * If the user is not authorized, it throws an error.
 */
export const deleteForm = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { status: FormStatus.DELETED },
      { new: true }
    );

    if (!form) {
      throw AppError.notFound("Form not found or unauthorized");
    }

    res.json({ message: "Form deleted successfully" });
  }
);
