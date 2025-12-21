import mongoose, { Schema, Document } from "mongoose";

export interface IFormResponseDocument extends Document {
  formId: string;
  userId?: string;
  answers: Record<string, any>;
  submittedAt: Date;
  updatedAt?: Date;
  googleSheetRowNumber?: number;
  sheetSyncStatus: "pending" | "synced" | "failed";
  sheetSyncError?: string;
  sheetSyncAttempts: number;
  userMetadata: {
    id: string;
    name: string;
    email: string;
  };
}

const FormResponseSchema: Schema = new Schema(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    answers: { type: Map, of: Schema.Types.Mixed },
    submittedAt: { type: Date, default: Date.now },
    googleSheetRowNumber: { type: Number },
    sheetSyncStatus: {
      type: String,
      enum: ["pending", "synced", "failed"],
      default: "pending",
    },
    sheetSyncError: { type: String },
    sheetSyncAttempts: { type: Number, default: 0 },
    userMetadata: {
      id: { type: String, default: "Anonymous" },
      name: { type: String, default: "Anonymous" },
      email: { type: String, default: "Anonymous" },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IFormResponseDocument>(
  "FormResponse",
  FormResponseSchema
);
