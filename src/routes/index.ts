import Router from "@koa/router";
import authRoutes from "./auth";
import hotelRoutes from "./hotels";
import bookingRoutes from "./bookings";
import externalRoutes from "./external";

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
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile (requires token)",
        logout: "POST /api/auth/logout (requires token)",
      },
      hotels: {
        list: "GET /api/hotels",
        search: "GET /api/hotels?city=...&price=...&rating=...",
        details: "GET /api/hotels/:id",
        availability: "GET /api/hotels/:id/availability",
        create: "POST /api/hotels (admin/employee)",
        update: "PUT /api/hotels/:id (admin/employee)",
        delete: "DELETE /api/hotels/:id (admin)",
      },
      bookings: {
        myBookings: "GET /api/bookings/my",
        create: "POST /api/bookings",
        details: "GET /api/bookings/:id",
        update: "PUT /api/bookings/:id",
        cancel: "DELETE /api/bookings/:id",
        listAll: "GET /api/bookings (admin/employee)",
      },
      external: {
        flights: "GET /api/external/flights/search",
        oneWayFlights: "GET /api/external/flights/oneway",
        airports: "GET /api/external/airports/search",
        popularDestinations: "GET /api/external/destinations/popular",
        priceTrends: "GET /api/external/price-trends",
        externalHotels: "GET /api/external/hotels/search",
        hotelDestinations: "GET /api/external/hotels/destinations",
        combinedSearch: "GET /api/external/combined/search",
        syncHotels: "POST /api/external/sync-hotels (admin/employee)",
      },
    },
  };
});

// Authentication routes
router.use(authRoutes.routes(), authRoutes.allowedMethods());

// Hotel routes
router.use(hotelRoutes.routes(), hotelRoutes.allowedMethods());

// Booking routes
router.use(bookingRoutes.routes(), bookingRoutes.allowedMethods());

// External API routes
router.use(externalRoutes.routes(), externalRoutes.allowedMethods());

// TODO: Add other route modules here
// import userRoutes from './users';
// import hotelRoutes from './hotels';
// import messageRoutes from './messages';

// router.use(userRoutes.routes(), userRoutes.allowedMethods());
// router.use(hotelRoutes.routes(), hotelRoutes.allowedMethods());
// router.use(messageRoutes.routes(), messageRoutes.allowedMethods());

export default router;
