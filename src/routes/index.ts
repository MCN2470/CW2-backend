import Router from "@koa/router";

const router = new Router({
  prefix: "/api",
});

// Health check route (separate from main health check)
router.get("/health", async (ctx) => {
  ctx.body = {
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  };
});

// Welcome route
router.get("/", async (ctx) => {
  ctx.body = {
    success: true,
    message: "Welcome to Wanderlust Travel API",
    documentation: "/api/docs",
    health: "/api/health",
    version: "1.0.0",
  };
});

// TODO: Add other route modules here
// import authRoutes from './auth';
// import userRoutes from './users';
// import hotelRoutes from './hotels';
// import messageRoutes from './messages';

// router.use(authRoutes.routes(), authRoutes.allowedMethods());
// router.use(userRoutes.routes(), userRoutes.allowedMethods());
// router.use(hotelRoutes.routes(), hotelRoutes.allowedMethods());
// router.use(messageRoutes.routes(), messageRoutes.allowedMethods());

export default router;
