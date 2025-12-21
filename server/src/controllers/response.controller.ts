import { Response } from "express";
import mongoose from "mongoose";
import FormResponse from "../models/FormResponse.model.ts";
import Form from "../models/Form.model.ts";
import User from "../models/User.model.ts";
import { AuthRequest } from "../middlewares/auth.middleware.ts";
import { FormStatus, QuestionType } from "@poc-admin-form/shared";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../errors/AppError.ts";

/**
 * Submit a response to a form
 * Note: Google Sheets sync is handled by MongoDB Atlas Triggers
 */
export const submitResponse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { formId } = req.body;
    // Enterprise Grade: Sanitize and validate payload structure to prevent nesting bugs
    const answers =
      req.body.answers && req.body.answers.answers
        ? req.body.answers.answers
        : req.body.answers;

    const userId = req.user ? req.user.userId : undefined;

    const form = await Form.findOne({
      _id: formId,
      status: FormStatus.PUBLISHED,
    });
    if (!form) {
      throw AppError.notFound("Form not found");
    }

    // Validate Short Answer Lengths
    for (const q of form.questions) {
      if (q.type === QuestionType.SHORT_ANSWER && answers[q.id]) {
        const ans = answers[q.id];
        if (typeof ans === "string" && ans.length > 255) {
          throw AppError.badRequest(
            `Answer for "${q.title}" is too long (max 255 chars)`
          );
        }
      }
    }

    // Prepare user metadata for Atlas Trigger to use
    let userMetadata = {
      id: "Anonymous",
      name: "Anonymous",
      email: "Anonymous",
    };
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        userMetadata = {
          id: String(user._id),
          name: user.name || "Unknown",
          email: user.email || "Unknown",
        };
      }
    }

    // Create response - Atlas Trigger will handle Google Sheets sync
    const response = await FormResponse.create({
      formId,
      userId,
      answers,
      userMetadata,
      sheetSyncStatus: form.googleSheetUrl ? "pending" : "synced",
      sheetSyncAttempts: 0,
    });

    await Form.findByIdAndUpdate(formId, { $inc: { responseCount: 1 } });

    // Return response with redirectionLink if form has one
    const responseData = {
      ...response.toObject(),
      redirectionLink: form.redirectionLink,
    };

    res.status(201).json(responseData);
  }
);

/**
 * Update a response
 * Note: Google Sheets sync is handled by MongoDB Atlas Triggers
 */
export const updateResponse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    // Enterprise Grade: Sanitize and validate payload structure to prevent nesting bugs
    const answers =
      req.body.answers && req.body.answers.answers
        ? req.body.answers.answers
        : req.body.answers;
    const userId = req.user!.userId;

    const response = await FormResponse.findOne({ _id: id, userId });
    if (!response) {
      throw AppError.notFound("Response not found or unauthorized");
    }

    const form = await Form.findById(response.formId);
    if (!form) {
      throw AppError.notFound("Form not found");
    }

    // Validate Short Answer Lengths
    for (const q of form.questions) {
      if (q.type === QuestionType.SHORT_ANSWER && answers[q.id]) {
        const ans = answers[q.id];
        if (typeof ans === "string" && ans.length > 255) {
          throw AppError.badRequest(
            `Answer for "${q.title}" is too long (max 255 chars)`
          );
        }
      }
    }

    if (!form.allowEditResponse) {
      throw AppError.forbidden(
        "Editing responses is not allowed for this form"
      );
    }

    // Update user metadata in case it changed
    let userMetadata = {
      id: "Anonymous",
      name: "Anonymous",
      email: "Anonymous",
    };
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        userMetadata = {
          id: String(user._id),
          name: user.name || "Unknown",
          email: user.email || "Unknown",
        };
      }
    }

    // Update response - Atlas Trigger will handle Google Sheets sync
    response.answers = answers;
    response.userMetadata = userMetadata;
    // Reset sync status to trigger re-sync via Atlas Trigger
    if (form.googleSheetUrl) {
      response.sheetSyncStatus = "pending";
    }
    response.markModified("answers");
    response.markModified("userMetadata");

    await response.save();

    res.json(response);
  }
);

/**
 * Get all form groups for the current user (without responses array)
 * Returns form metadata and response count for each form the user has responded to
 */
export const getMyResponses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      // 1. Match responses by user
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },

      // 2. Lookup Form details
      {
        $lookup: {
          from: "forms",
          localField: "formId",
          foreignField: "_id",
          as: "form",
        },
      },
      { $unwind: "$form" },

      // 3. Search Filter (if provided)
      ...(search
        ? [
            {
              $match: {
                "form.title": { $regex: search, $options: "i" },
              },
            },
          ]
        : []),

      // 4. Group by Form (no responses array - fetched separately via getFormResponses)
      {
        $group: {
          _id: "$form._id",
          form: { $first: "$form" },
          latestActivity: { $max: "$updatedAt" },
          responseCount: { $sum: 1 },
        },
      },

      // 5. Sort Groups by latest activity
      { $sort: { latestActivity: -1 } },

      // 6. Project clean structure
      {
        $project: {
          _id: 1,
          form: {
            _id: 1,
            title: 1,
            status: 1,
            allowEditResponse: 1,
          },
          latestActivity: 1,
          responseCount: 1,
        },
      },

      // 7. Facet for Pagination and Total Count
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await FormResponse.aggregate(pipeline);

    const data = result[0].data;
    const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

    res.json({
      data,
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
 * Get paginated responses for a specific form by the current user
 */
export const getFormResponses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { formId } = req.params;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 3;
    const skip = (page - 1) * limit;

    // Validate formId
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      throw AppError.badRequest("Invalid form ID");
    }

    const formObjectId = new mongoose.Types.ObjectId(formId);

    // Build query filter - using 'as any' to handle ObjectId type mismatch with interface
    const queryFilter = { formId: formObjectId, userId } as any;

    // Get paginated responses and total count in parallel
    const [responses, total] = await Promise.all([
      FormResponse.find(queryFilter)
        .select("_id answers createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FormResponse.countDocuments(queryFilter),
    ]);

    res.json({
      data: responses,
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
 * Get a response by id
 */
export const getResponseById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const response = await FormResponse.findOne({ _id: id, userId }).populate(
      "formId",
      "title allowEditResponse questions"
    );

    if (!response) {
      throw AppError.notFound("Response not found");
    }

    res.json(response);
  }
);

/**
 * Get current user's form submission count with time filter
 */
export const getMySubmissionCount = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const timeFilter = (req.query.timeFilter as string) || "all"; // today, month, all

    let dateFilter: any = {};

    if (timeFilter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { submittedAt: { $gte: startOfDay } };
    } else if (timeFilter === "month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { submittedAt: { $gte: startOfMonth } };
    }

    const count = await FormResponse.countDocuments({
      userId: userId,
      ...dateFilter,
    });

    res.json({ count, timeFilter });
  }
);
