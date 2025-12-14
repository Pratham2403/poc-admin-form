import winston from "winston";
import path from "path";
import { MongoTransport } from "./mongo.transport.ts";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const isProduction = process.env.NODE_ENV === "production";

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  const msg = stack || message;
  return `${timestamp} [${level}]: ${msg}`;
});

// Custom log format for files (JSON for easier parsing)
const fileFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    stack,
    ...meta,
  });
});

// Define log levels (npm standard)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Production: error, warn only | Development: all levels
const level = isProduction ? "warn" : "debug";

// Create transports array
const transports: winston.transport[] = [];

// Console transport - always active
transports.push(
  new winston.transports.Console({
    level: isProduction ? "warn" : "debug",
    format: combine(
      colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      errors({ stack: true }),
      consoleFormat
    ),
  })
);

// File transport - development only (combined.log for all, error.log for errors)
if (!isProduction) {
  const logsDir = path.join(process.cwd(), "logs");

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: combine(timestamp(), errors({ stack: true }), fileFormat),
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      level: "debug",
      format: combine(timestamp(), errors({ stack: true }), fileFormat),
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  levels,
  level,
  transports,
});

// MongoDB transport - added after DB connection is established
let mongoTransportAdded = false;
export const initMongoLogging = () => {
  if (mongoTransportAdded) return;

  logger.add(
    new MongoTransport({
      level: "warn", // Only error and warn go to MongoDB
      levels: ["error", "warn"],
    })
  );

  mongoTransportAdded = true;
  logger.info("MongoDB logging transport initialized");
};

export default logger;
