import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.utils.ts";
import { AppError } from "../errors/AppError.ts";
import { UserRole, UserStatus } from "@poc-admin-form/shared";
import User from "../models/User.model.ts";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    modulePermissions?: { users: boolean; forms: boolean };
  };
}

export const authenticate = async (
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
    req.user = decoded as AuthRequest["user"];

    const isActive = await User.exists({
      _id: req.user?.userId,
      status: UserStatus.ACTIVE,
    });
    if (!isActive) {
      return next(AppError.unauthorized("Not authorized"));
    }
    next();
  } catch (error) {
    next(AppError.unauthorized("Not authorized, token failed"));
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

/**
 * Module authorization middleware
 * SUPERADMIN bypasses all checks, ADMIN requires specific module permission
 */
export const authorizeModule = (module: "users" | "forms") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized("Not authorized, no user"));
    }

    if (req.user.role === UserRole.SUPERADMIN) {
      return next();
    }
    if (req.user.role === UserRole.ADMIN) {
      const permissions = req.user.modulePermissions;
      if (permissions?.[module] === true) {
        return next();
      }
      return next(AppError.forbidden(`No access to ${module} module`));
    }

    return next(AppError.forbidden("Admin access required"));
  };
};
