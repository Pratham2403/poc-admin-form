import { Request, Response } from "express";
import Form from "../models/Form.model.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { FormStatus, UserRole } from "@poc-admin-form/shared";

export const createForm = async (req: AuthRequest, res: Response) => {
  try {
    const form = await Form.create({
      ...req.body,
      createdBy: req.user.userId,
    });
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ message: "Error creating form", error });
  }
};

export const getForms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9; // Default to 9 for grid view (3x3)
    const skip = (page - 1) * limit;

    let query: any = {};

    if (userId) {
      // Authenticated Case:
      // Form creators can see all their forms (except deleted)
      // Everyone else (including other admins) can only see published forms OR public forms
      query = {
        $or: [
          // User's own forms (except deleted)
          {
            createdBy: userId,
            status: { $ne: FormStatus.DELETED }
          },
          // Published forms from others (Public or Private)
          {
            status: FormStatus.PUBLISHED
          }
        ]
      };
    } else {
      // Anonymous/Guest Case:
      // Can ONLY see Public forms that are Published
      query = {
        status: FormStatus.PUBLISHED,
        isPublic: true
      };
    }

    // Fetch forms and total count in parallel
    const [forms, total] = await Promise.all([
      Form.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Form.countDocuments(query)
    ]);

    res.json({
      data: forms,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching forms", error });
  }
};

export const getFormById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // First check if form exists and is not deleted
    const form = await Form.findOne({
      _id: id,
      status: { $ne: FormStatus.DELETED },
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Now check access permissions
    // Now check access permissions

    // 1. If user is anonymous
    if (!userId) {
      if (form.isPublic && form.status === FormStatus.PUBLISHED) {
        return res.json(form);
      }
      return res.status(401).json({ message: "You must be logged in to view this form." });
    }

    // 2. Authenticated Users (userId exists)

    // Case A: User is the Creator
    if (form.createdBy.toString() === userId) {
      // Creator can view their form regardless of status (unless deleted, which is already filtered)
      return res.json(form);
    }

    // Case B: User is NOT the Creator (Guest User / or Another Admin / SuperAdmin)
    // "Other Admins / Super Admins / Users can only access Published Forms both private and public."
    if (form.status === FormStatus.PUBLISHED) {
      return res.json(form);
    }

    // If not published, and user is not creator -> Forbidden
    return res.status(403).json({ message: "Not authorized to view this form (Form is not published)" });
  } catch (error) {
    res.status(500).json({ message: "Error fetching form", error });
  }
};

export const updateForm = async (req: AuthRequest, res: Response) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      req.body,
      { new: true }
    );
    if (!form) {
      return res
        .status(404)
        .json({ message: "Form not found or unauthorized" });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Error updating form", error });
  }
};

export const deleteForm = async (req: AuthRequest, res: Response) => {
  try {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { status: FormStatus.DELETED },
      { new: true }
    );
    if (!form) {
      return res
        .status(404)
        .json({ message: "Form not found or unauthorized" });
    }
    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting form", error });
  }
};
