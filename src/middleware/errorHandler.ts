import { Context, Next } from "koa";

interface KoaError extends Error {
  status?: number;
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (error) {
    const err = error as KoaError;

    // Set status code
    ctx.status = err.status || err.statusCode || 500;

    // Log error (in production, you might want to use a proper logging service)
    if (ctx.status >= 500) {
      console.error("Server Error:", {
        error: err.message,
        stack: err.stack,
        url: ctx.url,
        method: ctx.method,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn("Client Error:", {
        error: err.message,
        status: ctx.status,
        url: ctx.url,
        method: ctx.method,
        timestamp: new Date().toISOString(),
      });
    }

    // Prepare error response
    const response: any = {
      success: false,
      message: err.message || "An error occurred",
      timestamp: new Date().toISOString(),
      path: ctx.path,
    };

    // Add more details in development
    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
      response.details = err;
    }

    // Handle specific error types
    switch (ctx.status) {
      case 400:
        response.error = "Bad Request";
        break;
      case 401:
        response.error = "Unauthorized";
        response.message = "Authentication required";
        break;
      case 403:
        response.error = "Forbidden";
        response.message = "Access denied";
        break;
      case 404:
        response.error = "Not Found";
        response.message = "Resource not found";
        break;
      case 422:
        response.error = "Validation Error";
        break;
      case 429:
        response.error = "Too Many Requests";
        response.message = "Rate limit exceeded";
        break;
      case 500:
        response.error = "Internal Server Error";
        response.message = "Something went wrong on our end";
        break;
      default:
        response.error = "Error";
    }

    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
      ctx.status = 422;
      response.error = "Validation Error";
      response.details = (err as any).errors?.map((e: any) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      }));
    }

    // Handle Sequelize unique constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
      ctx.status = 409;
      response.error = "Conflict";
      response.message = "Resource already exists";
    }

    // Handle JWT errors
    if (err.name === "JsonWebTokenError") {
      ctx.status = 401;
      response.error = "Invalid Token";
      response.message = "Authentication token is invalid";
    }

    if (err.name === "TokenExpiredError") {
      ctx.status = 401;
      response.error = "Token Expired";
      response.message = "Authentication token has expired";
    }

    // Set response
    ctx.body = response;

    // Emit error event for monitoring/logging
    ctx.app.emit("error", error, ctx);
  }
};

// Create custom error classes
export class AppError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    status: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.status = status;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed") {
    super(message, 422);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409);
  }
}
