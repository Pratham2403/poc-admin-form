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
    const userId = req.user.userId;

    // Form creators can see all their forms (except deleted)
    // Everyone else (including other admins) can only see published forms
    const query = {
      $or: [
        // User's own forms (except deleted)
        {
          createdBy: userId,
          status: { $ne: FormStatus.DELETED }
        },
        // Published forms from others
        {
          status: FormStatus.PUBLISHED
        }
      ]
    };

    const forms = await Form.find(query).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching forms", error });
  }
};

export const getFormById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // First check if form exists and is not deleted
    const form = await Form.findOne({
      _id: id,
      status: { $ne: FormStatus.DELETED },
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Now check access permissions
    // Regular users can only access published forms
    // Admins can access their own forms unless they are in draft, archived, or unpublished status

    if (form.createdBy.toString() !== userId) {
      // Admin accessing their own form
      if (form.status === FormStatus.DRAFT || form.status === FormStatus.ARCHIVED || form.status === FormStatus.UNPUBLISHED) {
        return res.status(403).json({ message: "Not authorized to view this form" });
      }
    }
    // if (userRole === UserRole.ADMIN) {
    //   if (form.createdBy.toString() !== userId) {
    //     return res.status(403).json({ message: "Not authorized to view this form" });
    //   }
    // } else {
    //   // Regular users can only see published forms
    //   if (form.status !== FormStatus.PUBLISHED) {
    //     return res.status(404).json({ message: "Form not found" });
    //   }
    // }

    res.json(form);
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
