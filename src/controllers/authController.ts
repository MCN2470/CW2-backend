import { Context } from "koa";
import User from "../models/User";
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateVerificationToken,
} from "../utils/auth";
import { z } from "zod";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.enum(["customer", "employee", "admin"]).optional(),
  employeeSignupCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Register new user
export const register = async (ctx: Context): Promise<void> => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(ctx.request.body);
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      employeeSignupCode,
    } = validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      ctx.status = 409;
      ctx.body = {
        success: false,
        message: "User with this email already exists",
        error: "USER_EXISTS",
      };
      return;
    }

    // Handle employee/admin registration
    let userRole: "customer" | "employee" | "admin" = "customer";
    if (role === "employee" || role === "admin") {
      const requiredCode = process.env.EMPLOYEE_SIGNUP_CODE;
      if (!requiredCode || employeeSignupCode !== requiredCode) {
        ctx.status = 403;
        ctx.body = {
          success: false,
          message: "Invalid employee signup code",
          error: "INVALID_SIGNUP_CODE",
        };
        return;
      }
      userRole = role;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: userRole,
      isVerified: userRole === "admin", // Admins are auto-verified
      verificationToken: userRole !== "admin" ? verificationToken : undefined,
    });

    // Generate JWT token
    const token = generateToken(user);

    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
        needsVerification: !user.isVerified,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.errors,
      };
    } else {
      console.error("Registration error:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Registration failed",
        error: "REGISTRATION_FAILED",
      };
    }
  }
};

// Login user
export const login = async (ctx: Context): Promise<void> => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(ctx.request.body);
    const { email, password } = validatedData;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS",
      };
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Invalid email or password",
        error: "INVALID_CREDENTIALS",
      };
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
        },
        token,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "Validation failed",
        error: "VALIDATION_ERROR",
        details: error.errors,
      };
    } else {
      console.error("Login error:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Login failed",
        error: "LOGIN_FAILED",
      };
    }
  }
};

// Get current user profile
export const getProfile = async (ctx: Context): Promise<void> => {
  try {
    const userId = ctx.user?.userId;
    if (!userId) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        message: "Authentication required",
        error: "NOT_AUTHENTICATED",
      };
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND",
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          role: user.role,
          isVerified: user.isVerified,
          profileImage: user.profileImage,
          preferences: user.preferences,
          createdAt: user.createdAt,
        },
      },
    };
  } catch (error) {
    console.error("Get profile error:", error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Failed to retrieve profile",
      error: "PROFILE_FETCH_FAILED",
    };
  }
};

// Logout (in a stateless JWT system, this is mainly for client-side)
export const logout = async (ctx: Context): Promise<void> => {
  ctx.status = 200;
  ctx.body = {
    success: true,
    message: "Logout successful. Please remove the token from your client.",
  };
};
