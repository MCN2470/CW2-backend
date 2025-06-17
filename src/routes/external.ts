import Router from "@koa/router";
import { ExternalApiController } from "../controllers/externalApiController";
import { authenticate, authorize } from "../middleware/auth";

const router = new Router({ prefix: "/external" });

// Flight-related routes
router.get("/flights/search", ExternalApiController.searchFlights);
router.get("/flights/oneway", ExternalApiController.searchOneWayFlights);
router.get("/airports/search", ExternalApiController.searchAirports);
router.get(
  "/destinations/popular",
  ExternalApiController.getPopularDestinations
);
router.get("/price-trends", ExternalApiController.getFlightPriceTrends);

// Hotel-related routes
router.get("/hotels/search", ExternalApiController.searchExternalHotels);
router.get("/hotels/destinations", ExternalApiController.getHotelDestinations);
router.get(
  "/hotels/:code/availability",
  ExternalApiController.getExternalHotelAvailability
);

// Combined search routes
router.get("/combined/search", ExternalApiController.combinedSearch);

// Admin routes (protected)
router.post(
  "/sync-hotels",
  authenticate,
  authorize("admin", "employee"),
  ExternalApiController.syncHotelData
);

export default router;
