import Router from "@koa/router";
import {
  register,
  login,
  getProfile,
  logout,
} from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = new Router({
  prefix: "/auth",
});

// Public routes (no authentication required)
router.post("/register", register);
router.post("/login", login);

// Protected routes (authentication required)
router.get("/profile", authenticate, getProfile);
router.post("/logout", authenticate, logout);

// TODO: Add more auth routes
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);
// router.post('/verify-email', verifyEmail);
// router.post('/resend-verification', resendVerification);

export default router;
