import mongoose, { Schema, Document } from "mongoose";

export interface IErrorLog extends Document {
  level: "error" | "warn";
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: Date;
}

const ErrorLogSchema = new Schema<IErrorLog>({
  level: {
    type: String,
    enum: ["error", "warn"],
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  stack: String,
  context: Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// TTL index: auto-delete logs older than 30 days to prevent collection bloat
ErrorLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

export default mongoose.model<IErrorLog>("ErrorLog", ErrorLogSchema);
