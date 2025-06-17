import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import dotenv from "dotenv";
import { sequelize } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import apiRoutes from "./routes";

// Load environment variables
dotenv.config();

const app = new Koa();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Error handling middleware (should be first)
app.use(errorHandler);

// Logging middleware
app.use(logger);

// Body parser
app.use(
  bodyParser({
    jsonLimit: "10mb",
    formLimit: "10mb",
    textLimit: "10mb",
  })
);

// API routes
app.use(apiRoutes.routes());
app.use(apiRoutes.allowedMethods());

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.path === "/health") {
    ctx.body = {
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    };
    return;
  }
  await next();
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // Sync database models (be careful in production!)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("✅ Database models synchronized.");
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 Received SIGTERM, shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 Received SIGINT, shutting down gracefully...");
  await sequelize.close();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}
