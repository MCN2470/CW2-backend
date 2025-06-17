import Router from "@koa/router";
import { HotelController } from "../controllers/hotelController";
import { authenticate, authorize } from "../middleware/auth";

const router = new Router({ prefix: "/hotels" });

// Public routes (no authentication required)
router.get("/", HotelController.getAllHotels);
router.get("/:id", HotelController.getHotelById);
router.get("/:id/availability", HotelController.checkAvailability);

// Protected routes (authentication required)
router.post(
  "/",
  authenticate,
  authorize("admin", "employee"),
  HotelController.createHotel
);
router.put(
  "/:id",
  authenticate,
  authorize("admin", "employee"),
  HotelController.updateHotel
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  HotelController.deleteHotel
);

export default router;
