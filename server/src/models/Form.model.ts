import mongoose, { Schema, Document } from 'mongoose';
import { IForm, FormStatus, QuestionType } from '@poc-admin-form/shared';

export interface IFormDocument extends Omit<IForm, '_id'>, Document { }

const ValidationRuleSchema = new Schema({
    type: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
    message: { type: String }
});

const QuestionSchema = new Schema({
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: Object.values(QuestionType), required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    validationRules: [ValidationRuleSchema],
    minLabel: { type: String },
    maxLabel: { type: String },
    minValue: { type: Number },
    maxValue: { type: Number }
});

const FormSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    questions: [QuestionSchema],
    status: { type: String, enum: Object.values(FormStatus), default: FormStatus.DRAFT },
    googleSheetUrl: { type: String },
    allowEditResponse: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    responseCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IFormDocument>('Form', FormSchema);
