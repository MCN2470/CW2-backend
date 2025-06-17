import { Context, Next } from "koa";
import { verifyToken, JWTPayload } from "../utils/auth";
import User from "../models/User";

// Extend Koa context to include user
declare module "koa" {
  interface DefaultContext {
    user?: JWTPayload & {
      isAdmin: boolean;
      isEmployee: boolean;
      isCustomer: boolean;
    };
  }
}

// Authentication middleware - requires valid JWT token
export const authenticate = async (ctx: Context, next: Next): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = ctx.headers.authorization;
    if (!authHeader) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Access token is required",
        error: "MISSING_TOKEN",
      };
      return;
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(" ")[1];
    if (!token) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Invalid authorization header format",
        error: "INVALID_AUTH_HEADER",
      };
      return;
    }

    // Verify token
    const payload = verifyToken(token);

    // Add user info to context with role helpers
    ctx.user = {
      ...payload,
      isAdmin: payload.role === "admin",
      isEmployee: payload.role === "employee",
      isCustomer: payload.role === "customer",
    };

    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = {
      success: false,
      message: error instanceof Error ? error.message : "Authentication failed",
      error: "AUTH_FAILED",
    };
  }
};

// Optional authentication middleware - adds user to context if token is valid
export const optionalAuth = async (ctx: Context, next: Next): Promise<void> => {
  try {
    const authHeader = ctx.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (token) {
      const payload = verifyToken(token);
      ctx.user = {
        ...payload,
        isAdmin: payload.role === "admin",
        isEmployee: payload.role === "employee",
        isCustomer: payload.role === "customer",
      };
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  await next();
};

// Role-based authorization middleware
export const authorize = (
  ...roles: Array<"customer" | "employee" | "admin">
) => {
  return async (ctx: Context, next: Next): Promise<void> => {
    if (!ctx.user) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED",
      };
      return;
    }

    if (!roles.includes(ctx.user.role)) {
      ctx.status = 403;
      ctx.body = {
        success: false,
        message: "Insufficient permissions",
        error: "INSUFFICIENT_PERMISSIONS",
        required: roles,
        current: ctx.user.role,
      };
      return;
    }

    await next();
  };
};

// Admin only middleware
export const adminOnly = authorize("admin");

// Employee or admin middleware
export const employeeOrAdmin = authorize("employee", "admin");

// Verified user middleware - checks if user's email is verified
export const requireVerified = async (
  ctx: Context,
  next: Next
): Promise<void> => {
  if (!ctx.user) {
    ctx.status = 401;
    ctx.body = {
      success: false,
      message: "Authentication required",
      error: "NOT_AUTHENTICATED",
    };
    return;
  }

  // Get user from database to check verification status
  const user = await User.findByPk(ctx.user.userId);
  if (!user) {
    ctx.status = 401;
    ctx.body = {
      success: false,
      message: "User not found",
      error: "USER_NOT_FOUND",
    };
    return;
  }

  if (!user.isVerified) {
    ctx.status = 403;
    ctx.body = {
      success: false,
      message: "Email verification required",
      error: "EMAIL_NOT_VERIFIED",
    };
    return;
  }

  await next();
};
