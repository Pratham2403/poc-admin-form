import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import logger from "../lib/logger/index.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Global error handling middleware.
 * Catches all errors, logs them appropriately, and sends clean responses.
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default values
  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = err.message;
    isOperational = true;
  } else if (err.name === "CastError") {
    // Invalid MongoDB ObjectId
    statusCode = 400;
    message = "Invalid ID format";
    isOperational = true;
  } else if ((err as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = "Duplicate entry";
    isOperational = true;
  }

  // Log context for debugging
  const logContext = {
    context: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode,
    },
  };

  // Log based on error type
  if (isOperational) {
    // Expected errors - warn level
    logger.warn(message, logContext);
  } else {
    // Unexpected errors - error level with stack
    logger.error(err.message, { ...logContext, stack: err.stack });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development for non-operational errors
    ...(!isProduction && !isOperational && { stack: err.stack }),
  });
};

/**
 * Handle 404 routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next(AppError.notFound(`Route ${req.originalUrl} not found`));
};
