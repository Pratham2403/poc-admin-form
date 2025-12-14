/**
 * Custom error class for operational errors.
 * Operational errors are expected errors (e.g., validation, not found, unauthorized).
 * Non-operational errors are programming bugs or unknown errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common errors
  static badRequest(message: string = "Bad Request") {
    return new AppError(message, 400);
  }

  static unauthorized(message: string = "Unauthorized") {
    return new AppError(message, 401);
  }

  static forbidden(message: string = "Forbidden") {
    return new AppError(message, 403);
  }

  static notFound(message: string = "Not Found") {
    return new AppError(message, 404);
  }

  static internal(message: string = "Internal Server Error") {
    return new AppError(message, 500, false);
  }
}
