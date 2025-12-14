import { Response } from "express";
import mongoose from "mongoose";
import FormResponse from "../models/FormResponse.model.js";
import Form from "../models/Form.model.js";
// import User from "../models/User.model.js"; // Only needed for Google Sheets sync (now handled by MongoDB trigger)
import { AuthRequest } from "../middlewares/auth.middleware.js";
// import { syncResponseToSheet } from "../services/googleSheets.service.js"; // Now handled by MongoDB trigger
import { FormStatus, QuestionType } from "@poc-admin-form/shared";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../errors/AppError.js";
// import logger from "../lib/logger/index.js"; // Only needed for Google Sheets sync logging

/**
 * Submits a response to a form.
 * It validates the response, syncs to Google Sheets, and creates a new response document.
 */
export const submitResponse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { formId } = req.body;
    const answers = req.body.answers?.answers || req.body.answers;
    const userId = req.user?.userId;

    const form = await Form.findOne({
      _id: formId,
      status: FormStatus.PUBLISHED,
    });
    if (!form) {
      throw AppError.notFound("Form not found");
    }

    // Anonymous submission check
    if (!userId && !form.isPublic) {
      throw AppError.unauthorized("You must be logged in to submit this form.");
    }

    // Validate short answer lengths
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

    // =====================================================
    // Google Sheet sync - NOW HANDLED BY MONGODB TRIGGER
    // The Atlas trigger will automatically sync to Google Sheets
    // when this document is inserted. See: Atlas App Services
    // =====================================================
    // let googleSheetRowNumber = undefined;
    // if (form.googleSheetUrl) {
    //   try {
    //     let userDetails = {
    //       id: "Anonymous",
    //       name: "Anonymous",
    //       email: "Anonymous",
    //     };
    //     if (userId) {
    //       const user = await User.findById(userId);
    //       if (user) {
    //         userDetails = {
    //           id: String(user._id),
    //           name: user.name || "Unknown",
    //           email: user.email || "Unknown",
    //         };
    //       }
    //     }
    //     const rowNum = await syncResponseToSheet(
    //       form.googleSheetUrl,
    //       undefined,
    //       userDetails,
    //       answers,
    //       form.questions
    //     );
    //     if (rowNum) {
    //       googleSheetRowNumber = rowNum;
    //     }
    //   } catch (err) {
    //     logger.warn("Failed to sync response to Google Sheets", {
    //       context: { formId, error: (err as Error).message },
    //     });
    //   }
    // }

    const response = await FormResponse.create({
      formId,
      userId: userId || null,
      answers,
      // googleSheetRowNumber will be set by MongoDB trigger after sync
    });

    await Form.findByIdAndUpdate(formId, { $inc: { responseCount: 1 } });

    res.status(201).json(response);
  }
);


/**
 * Updates a response to a form.
 * It validates the response, syncs to Google Sheets, and updates the response document.
 */
export const updateResponse = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const answers = req.body.answers?.answers || req.body.answers;
    const userId = req.user.userId;

    const response = await FormResponse.findOne({ _id: id, userId });
    if (!response) {
      throw AppError.notFound("Response not found or unauthorized");
    }

    const form = await Form.findById(response.formId);
    if (!form) {
      throw AppError.notFound("Form not found");
    }

    // Validate short answer lengths
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

    response.answers = answers;
    response.markModified("answers");
    await response.save();

    // =====================================================
    // Google Sheet sync - NOW HANDLED BY MONGODB TRIGGER
    // The Atlas trigger will automatically sync to Google Sheets
    // when this document is updated. See: Atlas App Services
    // =====================================================
    // if (form.googleSheetUrl && response.googleSheetRowNumber) {
    //   try {
    //     let userDetails = {
    //       id: "Anonymous",
    //       name: "Anonymous",
    //       email: "Anonymous",
    //     };
    //     if (userId) {
    //       const user = await User.findById(userId);
    //       if (user) {
    //         userDetails = {
    //           id: String(user._id),
    //           name: user.name || "Unknown",
    //           email: user.email || "Unknown",
    //         };
    //       }
    //     }
    //     await syncResponseToSheet(
    //       form.googleSheetUrl,
    //       String(response.googleSheetRowNumber),
    //       userDetails,
    //       answers,
    //       form.questions
    //     );
    //   } catch (err) {
    //     logger.warn("Failed to sync update to Google Sheets", {
    //       context: { responseId: id, error: (err as Error).message },
    //     });
    //   }
    // }

    res.json(response);
  }
);


/**
 * Gets the responses for the current user.
 * It returns the responses for the current user.
 */
export const getMyResponses = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "forms",
          localField: "formId",
          foreignField: "_id",
          as: "form",
        },
      },
      { $unwind: "$form" },
      ...(search
        ? [
            {
              $match: {
                "form.title": { $regex: search, $options: "i" },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: "$form._id",
          form: { $first: "$form" },
          responses: { $push: "$$ROOT" },
          latestActivity: { $max: "$updatedAt" },
          responseCount: { $sum: 1 },
        },
      },
      { $sort: { latestActivity: -1 } },
      {
        $project: {
          _id: 1,
          form: {
            _id: 1,
            title: 1,
            status: 1,
            allowEditResponse: 1,
          },
          responses: {
            _id: 1,
            answers: 1,
            createdAt: 1,
            updatedAt: 1,
          },
          latestActivity: 1,
          responseCount: 1,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await FormResponse.aggregate(pipeline);
    const data = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

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
 * Gets a response by its ID.
 * It returns the response by its ID.
 * It also populates the form data.
 */ 
export const getResponseById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user.userId;

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
