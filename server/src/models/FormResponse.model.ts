import mongoose, { Schema, Document } from 'mongoose';

export interface IFormResponseDocument extends Document {
    formId: string;
    userId?: string; // Optional if we allow anonymous, but requirements say "Users can...", implying logged in.
    answers: Record<string, any>; // questionId -> answer
    submittedAt: Date;
    updatedAt?: Date;
    googleSheetRowNumber?: number;
}

const FormResponseSchema: Schema = new Schema({
    formId: { type: Schema.Types.ObjectId, ref: 'Form', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' }, // Optional for now
    answers: { type: Map, of: Schema.Types.Mixed },
    submittedAt: { type: Date, default: Date.now },
    googleSheetRowNumber: { type: Number }
}, { timestamps: true });

export default mongoose.model<IFormResponseDocument>('FormResponse', FormResponseSchema);
