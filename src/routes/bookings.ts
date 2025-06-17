import Router from "@koa/router";
import { BookingController } from "../controllers/bookingController";
import { authenticate, authorize } from "../middleware/auth";

const router = new Router({ prefix: "/bookings" });

// All booking routes require authentication
router.use(authenticate);

// User routes (authenticated users)
router.get("/my", BookingController.getMyBookings);
router.post("/", BookingController.createBooking);
router.get("/:id", BookingController.getBookingById);
router.put("/:id", BookingController.updateBooking);
router.delete("/:id", BookingController.cancelBooking);

// Admin/Employee routes
router.get(
  "/",
  authorize("admin", "employee"),
  BookingController.getAllBookings
);

export default router;
