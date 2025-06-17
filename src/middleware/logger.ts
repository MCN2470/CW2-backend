import { Context, Next } from "koa";

interface LogData {
  method: string;
  url: string;
  status: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  timestamp: string;
  userId?: string | number;
}

export const logger = async (ctx: Context, next: Next): Promise<void> => {
  const start = Date.now();

  // Get client IP address
  const getClientIP = (ctx: Context): string => {
    return (
      (ctx.request.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (ctx.request.headers["x-real-ip"] as string) ||
      ctx.request.ip ||
      "unknown"
    );
  };

  try {
    await next();
  } catch (error) {
    // Log will be handled by error handler, but we still want to record timing
    throw error;
  } finally {
    const responseTime = Date.now() - start;

    const logData: LogData = {
      method: ctx.method,
      url: ctx.url,
      status: ctx.status,
      responseTime,
      userAgent: ctx.request.headers["user-agent"],
      ip: getClientIP(ctx),
      timestamp: new Date().toISOString(),
      userId: ctx.state.user?.id,
    };

    // Color codes for terminal output
    const colors = {
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      red: "\x1b[31m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      reset: "\x1b[0m",
    };

    // Choose color based on status code
    let statusColor = colors.green;
    if (ctx.status >= 400 && ctx.status < 500) {
      statusColor = colors.yellow;
    } else if (ctx.status >= 500) {
      statusColor = colors.red;
    }

    // Choose color based on response time
    let timeColor = colors.green;
    if (responseTime > 500) {
      timeColor = colors.yellow;
    } else if (responseTime > 1000) {
      timeColor = colors.red;
    }

    // Format the log message
    const logMessage = [
      `${colors.cyan}${logData.timestamp}${colors.reset}`,
      `${colors.blue}[${logData.method}]${colors.reset}`,
      `${statusColor}${logData.status}${colors.reset}`,
      `${logData.url}`,
      `${timeColor}${responseTime}ms${colors.reset}`,
      `${colors.magenta}${logData.ip}${colors.reset}`,
      logData.userId ? `user:${logData.userId}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(logMessage);
    } else {
      // In production, you might want to use a proper logging service
      // For now, we'll just log JSON for easier parsing
      console.log(JSON.stringify(logData));
    }

    // You can extend this to send logs to external services like:
    // - Winston
    // - ELK Stack
    // - CloudWatch
    // - Datadog
    // etc.
  }
};

// Request ID middleware for tracking requests across services
export const requestId = async (ctx: Context, next: Next): Promise<void> => {
  // Generate or use existing request ID
  const requestId =
    ctx.request.headers["x-request-id"] ||
    ctx.request.headers["x-correlation-id"] ||
    generateRequestId();

  // Set request ID in context and response headers
  ctx.state.requestId = requestId;
  ctx.set("X-Request-ID", requestId);

  await next();
};

// Simple request ID generator
const generateRequestId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Enhanced logger with request/response body logging (use carefully!)
export const detailedLogger = async (
  ctx: Context,
  next: Next
): Promise<void> => {
  const start = Date.now();

  // Log request
  const requestLog = {
    type: "request",
    method: ctx.method,
    url: ctx.url,
    headers: ctx.request.headers,
    body: (ctx.request as any).body,
    timestamp: new Date().toISOString(),
    requestId: ctx.state.requestId,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("Request:", JSON.stringify(requestLog, null, 2));
  }

  await next();

  // Log response
  const responseTime = Date.now() - start;
  const responseLog = {
    type: "response",
    status: ctx.status,
    responseTime,
    headers: ctx.response.headers,
    body: typeof ctx.body === "object" ? ctx.body : "non-json-response",
    timestamp: new Date().toISOString(),
    requestId: ctx.state.requestId,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("Response:", JSON.stringify(responseLog, null, 2));
  }
};
