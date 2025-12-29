import { Response } from "express";
import mongoose from "mongoose";
import FormResponse from "../models/FormResponse.model.ts";
import Form from "../models/Form.model.ts";
import User from "../models/User.model.ts";
import { AuthRequest } from "../middlewares/auth.middleware.ts";
import { FormStatus, QuestionType } from "@poc-admin-form/shared";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../errors/AppError.ts";
import { buildDateRangeFilter } from "../utils/helper.utils.ts";

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
      throw AppError.notFound("Form not found or not published");
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
      const user = await User.findById(userId).select("name email").lean();
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
      const user = await User.findById(userId).select("name email").lean();
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
 * Get paginated responses for the current user
 */
export const getMyResponses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const formIdsRaw = req.query.formIds as string | string[] | undefined;
    const skip = (page - 1) * limit;

    const dateFilter = buildDateRangeFilter(startDate, endDate, "submittedAt");

    const parsedFormIds = Array.isArray(formIdsRaw)
      ? formIdsRaw
      : typeof formIdsRaw === "string"
      ? formIdsRaw.split(",")
      : [];

    const formObjectIds = parsedFormIds
      .map((id) => id.trim())
      .filter(Boolean)
      .map((id) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw AppError.badRequest("Invalid formIds filter");
        }
        return new mongoose.Types.ObjectId(id);
      });

    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          ...dateFilter,
          ...(formObjectIds.length > 0
            ? { formId: { $in: formObjectIds } }
            : {}),
        },
      },
      { $sort: { updatedAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "forms",
                localField: "formId",
                foreignField: "_id",
                as: "form",
              },
            },
            { $unwind: "$form" },
            {
              $project: {
                _id: 1,
                answers: 1,
                createdAt: 1,
                updatedAt: 1,
                submittedAt: 1,
                form: {
                  _id: 1,
                  title: 1,
                  allowEditResponse: 1,
                },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await FormResponse.aggregate(pipeline);

    const data = result[0]?.data ?? [];
    const total = result[0]?.totalCount?.[0]?.count ?? 0;

    res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      startDate,
      endDate,
    });
  }
);

/**
 * Get distinct forms the current user has responded to (for filter UI)
 */
export const getMyRespondedForms = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "$formId",
        },
      },
      {
        $lookup: {
          from: "forms",
          localField: "_id",
          foreignField: "_id",
          as: "form",
        },
      },
      {
        $unwind: {
          path: "$form",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          formId: "$_id",
          title: "$form.title",
        },
      },
      { $sort: { title: 1 } },
    ];

    const data = await FormResponse.aggregate(pipeline);
    res.json({ data });
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
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const dateFilter = buildDateRangeFilter(startDate, endDate, "submittedAt");

    const count = await FormResponse.countDocuments({
      userId: userId,
      ...dateFilter,
    });

    res.json({ count, startDate, endDate });
  }
);
