import { Request, Response, NextFunction } from "express";

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps async route handlers to catch errors and forward to error middleware.
 * Eliminates repetitive try-catch blocks in controllers.
 */
export const asyncHandler = (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
