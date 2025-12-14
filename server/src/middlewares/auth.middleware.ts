import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils.js";
import { AppError } from "../errors/AppError.js";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.access_token;

  if (!token) {
    return next(AppError.unauthorized("Not authorized, no token"));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(AppError.unauthorized("Not authorized, token failed"));
  }
};

export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.access_token;

  if (!token) {
    req.user = undefined;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // If token is invalid, treat as guest
    req.user = undefined;
    next();
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        AppError.forbidden("Not authorized, insufficient permissions")
      );
    }
    next();
  };
};
