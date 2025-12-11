import { Request, Response } from 'express';
import mongoose from 'mongoose';
import FormResponse from '../models/FormResponse.model.js';
import Form from '../models/Form.model.js';
import User from '../models/User.model.js'; // Added User import
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { syncResponseToSheet } from '../services/googleSheets.service.js';
import { FormStatus, QuestionType } from '@poc-admin-form/shared';


export const submitResponse = async (req: AuthRequest, res: Response) => {
    try {
        const { formId } = req.body;
        // Enterprise Grade: Sanitize and validate payload structure to prevent nesting bugs
        const answers = req.body.answers && req.body.answers.answers ? req.body.answers.answers : req.body.answers;

        const userId = req.user ? req.user.userId : undefined;

        const form = await Form.findOne({ _id: formId, status: FormStatus.PUBLISHED });
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        // Duplicate check removed to allow multiple responses per user
        // const existingResponse = await FormResponse.findOne({ formId, userId });
        // if (existingResponse) {
        //     return res.status(409).json({ message: 'You have already submitted this form.' });
        // }

        // Validate Short Answer Lengths
        for (const q of form.questions) {
            if (q.type === QuestionType.SHORT_ANSWER && answers[q.id]) {
                const ans = answers[q.id];
                if (typeof ans === 'string' && ans.length > 255) {
                    return res.status(400).json({ message: `Answer for "${q.title}" is too long (max 255 chars)` });
                }
            }
        }

        let googleSheetRowNumber = undefined;

        // Google Sheet Sync - STRICT MAPPING
        // Columns: [User ID, Name, Email, Q1, Q2, ...]
        if (form.googleSheetUrl) {
            try {
                // Fetch User Details for robust data
                let userDetails = { id: 'Anonymous', name: 'Anonymous', email: 'Anonymous' };
                if (userId) {
                    const user = await User.findById(userId);
                    if (user) {
                        userDetails = { id: String(user._id), name: user.name || 'Unknown', email: user.email || 'Unknown' };
                    }
                }

                const rowNum = await syncResponseToSheet(
                    form.googleSheetUrl,
                    undefined,
                    userDetails,
                    answers,
                    form.questions
                );
                if (rowNum) {
                    googleSheetRowNumber = rowNum;
                }
            } catch (err) {
                console.error("Failed to sync to sheets", err);
                // We don't fail the request if sheet sync fails, but we log it.
            }
        }

        const response = await FormResponse.create({
            formId,
            userId,
            answers, // Sanitized answers
            googleSheetRowNumber
        });

        await Form.findByIdAndUpdate(formId, { $inc: { responseCount: 1 } });

        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error submitting response', error });
    }
};

export const updateResponse = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        // Enterprise Grade: Sanitize and validate payload structure to prevent nesting bugs
        const answers = req.body.answers && req.body.answers.answers ? req.body.answers.answers : req.body.answers;
        const userId = req.user.userId;

        const response = await FormResponse.findOne({ _id: id, userId });
        if (!response) {
            return res.status(404).json({ message: 'Response not found or unauthorized' });
        }

        const form = await Form.findById(response.formId);
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        // Validate Short Answer Lengths
        for (const q of form.questions) {
            if (q.type === QuestionType.SHORT_ANSWER && answers[q.id]) {
                const ans = answers[q.id];
                if (typeof ans === 'string' && ans.length > 255) {
                    return res.status(400).json({ message: `Answer for "${q.title}" is too long (max 255 chars)` });
                }
            }
        }

        if (!form.allowEditResponse) {
            return res.status(403).json({ message: 'Editing responses is not allowed for this form' });
        }

        // Fix Nested Response Bug: Clean assignment of sanitized answers.
        response.answers = answers;
        response.markModified('answers'); // Explicitly mark modified for Mixed/Map types just in case

        await response.save();

        if (form.googleSheetUrl && response.googleSheetRowNumber) {
            try {
                // Fetch User Details for robust data (in case name changed)
                let userDetails = { id: 'Anonymous', name: 'Anonymous', email: 'Anonymous' };
                if (userId) {
                    const user = await User.findById(userId);
                    if (user) {
                        userDetails = { id: String(user._id), name: user.name || 'Unknown', email: user.email || 'Unknown' };
                    }
                }

                await syncResponseToSheet(
                    form.googleSheetUrl,
                    String(response.googleSheetRowNumber),
                    userDetails,
                    answers,
                    form.questions
                );
            } catch (err) {
                console.error("Failed to sync update to sheets", err);
            }
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error updating response', error });
    }
};

// export const getResponses = async (req: AuthRequest, res: Response) => {
//     try {
//         const { formId } = req.params;
//         const responses = await FormResponse.find({ formId }).populate('userId', 'name email');
//         res.json(responses);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching responses', error });
//     }
// };

export const getMyResponses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || '';
        const skip = (page - 1) * limit;

        const pipeline: any[] = [
            // 1. Match responses by user
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },

            // 2. Lookup Form details
            {
                $lookup: {
                    from: 'forms',
                    localField: 'formId',
                    foreignField: '_id',
                    as: 'form'
                }
            },
            { $unwind: '$form' },

            // 3. Search Filter (if provided)
            ...(search ? [{
                $match: {
                    'form.title': { $regex: search, $options: 'i' }
                }
            }] : []),

            // 4. Group by Form
            {
                $group: {
                    _id: '$form._id',
                    form: { $first: '$form' },
                    responses: { $push: '$$ROOT' },
                    latestActivity: { $max: '$updatedAt' },
                    responseCount: { $sum: 1 }
                }
            },

            // 5. Sort Groups by latest activity
            { $sort: { latestActivity: -1 } },

            // 6. Project clean structure (remove form from inside responses to avoid duplication if needed, but keeping simple for now)
            {
                $project: {
                    _id: 1,
                    form: {
                        _id: 1,
                        title: 1,
                        status: 1,
                        allowEditResponse: 1
                    },
                    responses: {
                        _id: 1,
                        answers: 1,
                        createdAt: 1,
                        updatedAt: 1
                    },
                    latestActivity: 1,
                    responseCount: 1
                }
            },

            // 7. Facet for Pagination and Total Count
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
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
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error in getMyResponses:', error);
        res.status(500).json({ message: 'Error fetching responses', error });
    }
};

export const getResponseById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const response = await FormResponse.findOne({ _id: id, userId })
            .populate('formId', 'title allowEditResponse questions');

        if (!response) {
            return res.status(404).json({ message: 'Response not found' });
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching response', error });
    }
};
