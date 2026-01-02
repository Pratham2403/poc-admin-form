import { Response } from "express";
import mongoose from "mongoose";
import Form from "../models/Form.model.ts";
import { AuthRequest } from "../middlewares/auth.middleware.ts";
import { FormStatus } from "@poc-admin-form/shared";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { AppError } from "../errors/AppError.ts";
import { buildDateRangeFilter, buildSafeRegex } from "../utils/helper.utils.ts";
/**
 * Create a new form
 */
export const createForm = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const form = await Form.create({
      ...req.body,
      createdBy: req.user!.userId,
    });
    res.status(201).json(form);
  }
);

/**
 * Get all forms with pagination, search, and user response status
 * Uses aggregation to check if current user has responded to each form
 */
export const getForms = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    // const userId = req.user.userId;
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9; // Default to 9 for grid view (3x3)
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    // Build base match conditions
    const baseMatch: any = {
      $or: [
        // User's own forms (except deleted)
        {
          createdBy: userId,
          status: { $ne: FormStatus.DELETED },
        },
        // Published forms from others
        {
          status: FormStatus.PUBLISHED,
        },
      ],
    };

    // Add search conditions if provided
    if (search) {
      const safePattern = buildSafeRegex(search);
      baseMatch.$and = [
        {
          $or: [
            { title: { $regex: safePattern } },
            { description: { $regex: safePattern } },
          ],
        },
      ];
    }

    // Aggregation pipeline to get forms with pagination + total count.
    // Important: paginate BEFORE $lookup so the lookup runs only for the current page.
    const pipeline: any[] = [
      { $match: baseMatch },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "formresponses",
                let: { formId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$formId", "$$formId"] },
                          { $eq: ["$userId", userId] },
                        ],
                      },
                    },
                  },
                  { $limit: 1 },
                ],
                as: "userResponses",
              },
            },
            {
              $addFields: {
                responded: { $gt: [{ $size: "$userResponses" }, 0] },
              },
            },
            {
              $project: {
                userResponses: 0,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Form.aggregate(pipeline);

    const forms = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

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
 * Get a form by id
 */
export const getFormById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    // First check if form exists and is not deleted
    const form = await Form.findOne({
      _id: id,
      status: { $ne: FormStatus.DELETED },
    });

    if (!form) {
      throw AppError.notFound("Form not found");
    }

    // Now check access permissions
    // Regular users can only access published forms
    // Admins can access their own forms unless they are in draft, archived, or unpublished status

    if (form.createdBy.toString() !== userId) {
      // Admin accessing their own form
      if (
        form.status === FormStatus.DRAFT ||
        form.status === FormStatus.ARCHIVED ||
        form.status === FormStatus.UNPUBLISHED
      ) {
        throw AppError.forbidden("Form is not published, hence not accessible");
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
  }
);

/**
 * Update a form
 */
export const updateForm = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user!.userId },
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
 * Delete a form
 */
export const deleteForm = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const form = await Form.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user!.userId },
      { status: FormStatus.DELETED },
      { new: true }
    );
    if (!form) {
      throw AppError.notFound("Form not found or unauthorized");
    }
    res.json({ message: "Form deleted successfully" });
  }
);

/**
 * Get form statistics with time-based filtering
 */
export const getFormStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const dateFilter = buildDateRangeFilter(startDate, endDate);

    // Exclude deleted forms from stats
    const baseFilter = {
      ...dateFilter,
      status: { $ne: FormStatus.DELETED },
    };

    const [totalForms, publishedForms, responseAggregation] = await Promise.all(
      [
        Form.countDocuments(baseFilter),
        Form.countDocuments({ ...baseFilter, status: FormStatus.PUBLISHED }),
        Form.aggregate([
          { $match: baseFilter },
          { $group: { _id: null, total: { $sum: "$responseCount" } } },
        ]),
      ]
    );

    res.json({
      totalForms,
      publishedForms,
      totalResponses: responseAggregation[0]?.total || 0,
      startDate,
      endDate,
    });
  }
);
