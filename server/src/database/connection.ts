import mongoose from "mongoose";
import logger, { initMongoLogging } from "../lib/logger/index.ts";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "");
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Initialize MongoDB logging transport after successful connection
    initMongoLogging();
  } catch (error) {
    logger.error("MongoDB connection failed", {
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
};
