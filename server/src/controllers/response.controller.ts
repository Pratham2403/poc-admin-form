import { Request, Response } from 'express';
import FormResponse from '../models/FormResponse.model.js';
import Form from '../models/Form.model.js';
import User from '../models/User.model.js'; // Added User import
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { appendToSheet, updateSheetRow } from '../services/googleSheets.service.js';
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

        // CRITICAL FIX: Check for duplicate submission BEFORE Google Sheets sync
        // This prevents orphaned spreadsheet entries from parallel requests
        const existingResponse = await FormResponse.findOne({ formId, userId });
        if (existingResponse) {
            return res.status(409).json({ message: 'You have already submitted this form.' });
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

                // Map answers strictly to question order
                const questionData = form.questions.map(q => {
                    const answer = answers[q.id];
                    if (Array.isArray(answer)) return answer.join(', ');
                    return answer !== undefined && answer !== null ? String(answer) : '';
                });

                const fullRow = [userDetails.id, userDetails.name, userDetails.email, ...questionData];

                const rowNum = await appendToSheet(form.googleSheetUrl, fullRow);
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

                const questionData = form.questions.map(q => {
                    const answer = answers[q.id];
                    if (Array.isArray(answer)) return answer.join(', ');
                    return answer !== undefined && answer !== null ? String(answer) : '';
                });

                const fullRow = [userDetails.id, userDetails.name, userDetails.email, ...questionData];

                await updateSheetRow(form.googleSheetUrl, response.googleSheetRowNumber, fullRow);
            } catch (err) {
                console.error("Failed to sync update to sheets", err);
            }
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error updating response', error });
    }
};

export const getResponses = async (req: AuthRequest, res: Response) => {
    try {
        const { formId } = req.params;
        const responses = await FormResponse.find({ formId }).populate('userId', 'name email');
        res.json(responses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching responses', error });
    }
};

export const getMyResponses = async (req: AuthRequest, res: Response) => {
    try {
        const responses = await FormResponse.find({ userId: req.user.userId }).populate('formId', 'title allowEditResponse');
        res.json(responses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching responses', error });
    }
};
