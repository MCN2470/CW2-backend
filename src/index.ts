import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import dotenv from "dotenv";
import ratelimit from "koa-ratelimit";
import { sequelize } from "./config/database";
import { initializeAssociations } from "./models";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import apiRoutes from "./routes";

// Load environment variables
dotenv.config();

const app = new Koa();
const PORT = process.env.PORT || 3001;

// Rate limiting
const rateLimit = ratelimit({
  driver: "memory",
  db: new Map(),
  duration: 60000, // 1 minute
  errorMessage: "Rate limit exceeded. Please try again later.",
  id: (ctx) => ctx.ip,
  headers: {
    remaining: "Rate-Limit-Remaining",
    reset: "Rate-Limit-Reset",
    total: "Rate-Limit-Total",
  },
  max: 100, // Max 100 requests per minute
  disableHeader: false,
});

// Middleware chain
app.use(errorHandler);
app.use(logger);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(rateLimit);
app.use(
  bodyParser({
    jsonLimit: "10mb",
    textLimit: "10mb",
  })
);

// API routes
app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.path === "/health") {
    let dbStatus = "connected";
    let dbMessage = "Database connection is healthy";

    try {
      await sequelize.authenticate();
    } catch (error) {
      dbStatus = "disconnected";
      dbMessage = "Database connection failed";
    }

    ctx.body = {
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      message: "Server is running",
      database: {
        status: dbStatus,
        message: dbMessage,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
      },
    };
    return;
  }
  await next();
});

// Start server (with database connection)
const startServer = async () => {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connected successfully");

    // Initialize model associations
    initializeAssociations();

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API welcome: http://localhost:${PORT}/api`);
      console.log(`API health: http://localhost:${PORT}/api/health`);
      console.log("");
      console.log("Ready for testing! Try these endpoints:");
      console.log("   GET http://localhost:3001/health");
      console.log("   GET http://localhost:3001/api");
      console.log("   GET http://localhost:3001/api/health");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\nSIGINT received, shutting down gracefully");
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}
