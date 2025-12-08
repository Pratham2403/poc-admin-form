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
    const { role } = req.user;
    let query = {};

    if (role === UserRole.ADMIN) {
      query = {
        createdBy: req.user.userId,
        status: { $ne: FormStatus.DELETED },
      };
    } else {
      query = { status: FormStatus.PUBLISHED };
    }

    const forms = await Form.find(query).sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching forms", error });
  }
};

export const getFormById = async (req: Request, res: Response) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id,
      status: { $ne: FormStatus.DELETED },
    });
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }
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
