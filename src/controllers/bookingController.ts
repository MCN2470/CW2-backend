import { Context } from "koa";
import { z } from "zod";
import { Booking, Hotel, User } from "../models";
import { Op } from "sequelize";

// Validation schemas
const createBookingSchema = z
  .object({
    hotelId: z.number().int().positive(),
    checkInDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid check-in date format",
    }),
    checkOutDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid check-out date format",
    }),
    numberOfGuests: z.number().int().min(1).max(20),
    numberOfRooms: z.number().int().min(1).max(10),
    contactEmail: z.string().email(),
    contactPhone: z.string().max(20).optional(),
    specialRequests: z.string().max(1000).optional(),
    guestNames: z.array(z.string()).max(20).optional(),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      return checkOut > checkIn;
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOutDate"],
    }
  )
  .refine(
    (data) => {
      const checkIn = new Date(data.checkInDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return checkIn >= today;
    },
    {
      message: "Check-in date cannot be in the past",
      path: ["checkInDate"],
    }
  );

const updateBookingSchema = z.object({
  checkInDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid check-in date format",
    })
    .optional(),
  checkOutDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid check-out date format",
    })
    .optional(),
  numberOfGuests: z.number().int().min(1).max(20).optional(),
  numberOfRooms: z.number().int().min(1).max(10).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  specialRequests: z.string().max(1000).optional(),
  guestNames: z.array(z.string()).max(20).optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  totalPrice: z.number().positive().optional(),
});

const searchBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  hotelId: z.number().int().positive().optional(),
  userId: z.number().int().positive().optional(),
  checkInFrom: z.string().optional(),
  checkInTo: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["created", "checkin", "checkout", "total"])
    .default("created"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export class BookingController {
  // GET /api/bookings - Get all bookings (with filtering)
  static async getAllBookings(ctx: Context) {
    try {
      const query = searchBookingSchema.parse(ctx.query);

      const whereConditions: any = {};

      // Apply filters
      if (query.status) {
        whereConditions.status = query.status;
      }

      if (query.paymentStatus) {
        whereConditions.paymentStatus = query.paymentStatus;
      }

      if (query.hotelId) {
        whereConditions.hotelId = query.hotelId;
      }

      if (query.userId) {
        whereConditions.userId = query.userId;
      }

      if (query.checkInFrom || query.checkInTo) {
        whereConditions.checkInDate = {};
        if (query.checkInFrom)
          whereConditions.checkInDate[Op.gte] = query.checkInFrom;
        if (query.checkInTo)
          whereConditions.checkInDate[Op.lte] = query.checkInTo;
      }

      // Role-based filtering
      if (!ctx.user?.isAdmin && !ctx.user?.isEmployee) {
        // Customers can only see their own bookings
        whereConditions.userId = ctx.user?.userId;
      }

      // Sorting
      let orderBy: any = [];
      switch (query.sortBy) {
        case "created":
          orderBy = [["createdAt", query.sortOrder]];
          break;
        case "checkin":
          orderBy = [["checkInDate", query.sortOrder]];
          break;
        case "checkout":
          orderBy = [["checkOutDate", query.sortOrder]];
          break;
        case "total":
          orderBy = [["totalPrice", query.sortOrder]];
          break;
      }

      // Pagination
      const offset = (query.page - 1) * query.limit;

      const { count, rows: bookings } = await Booking.findAndCountAll({
        where: whereConditions,
        order: orderBy,
        limit: query.limit,
        offset: offset,
        include: [
          {
            model: Hotel,
            as: "hotel",
            attributes: [
              "id",
              "name",
              "city",
              "country",
              "starRating",
              "images",
            ],
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      // Add computed fields
      const bookingsWithDetails = bookings.map((booking) => {
        const bookingData = booking.toJSON();
        return {
          ...bookingData,
          numberOfNights: booking.getNumberOfNights(),
          isUpcoming: booking.isUpcoming(),
          isCurrentStay: booking.isCurrentStay(),
          isPastStay: booking.isPastStay(),
          canBeCancelled: booking.canBeCancelled(),
        };
      });

      ctx.body = {
        success: true,
        data: {
          bookings: bookingsWithDetails,
          pagination: {
            currentPage: query.page,
            totalPages: Math.ceil(count / query.limit),
            totalItems: count,
            itemsPerPage: query.limit,
          },
          filters: {
            status: query.status,
            paymentStatus: query.paymentStatus,
            hotelId: query.hotelId,
            checkInRange:
              query.checkInFrom || query.checkInTo
                ? {
                    from: query.checkInFrom,
                    to: query.checkInTo,
                  }
                : null,
          },
        },
        message: `Found ${count} bookings`,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid search parameters",
          errors: error.errors,
        };
        return;
      }

      console.error("Error fetching bookings:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/bookings/:id - Get single booking by ID
  static async getBookingById(ctx: Context) {
    try {
      const bookingId = parseInt(ctx.params.id);

      if (isNaN(bookingId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid booking ID",
        };
        return;
      }

      const whereConditions: any = { id: bookingId };

      // Role-based access control
      if (!ctx.user?.isAdmin && !ctx.user?.isEmployee) {
        whereConditions.userId = ctx.user?.userId;
      }

      const booking = await Booking.findOne({
        where: whereConditions,
        include: [
          {
            model: Hotel,
            as: "hotel",
            attributes: [
              "id",
              "name",
              "address",
              "city",
              "country",
              "starRating",
              "images",
              "phoneNumber",
              "email",
            ],
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName", "email", "phoneNumber"],
          },
        ],
      });

      if (!booking) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Booking not found",
        };
        return;
      }

      const bookingData = booking.toJSON();

      ctx.body = {
        success: true,
        data: {
          ...bookingData,
          numberOfNights: booking.getNumberOfNights(),
          isUpcoming: booking.isUpcoming(),
          isCurrentStay: booking.isCurrentStay(),
          isPastStay: booking.isPastStay(),
          canBeCancelled: booking.canBeCancelled(),
        },
        message: "Booking retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching booking:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // POST /api/bookings - Create new booking
  static async createBooking(ctx: Context) {
    try {
      const bookingData = createBookingSchema.parse(ctx.request.body);

      // Check if hotel exists and is active
      const hotel = await Hotel.findByPk(bookingData.hotelId);
      if (!hotel || !hotel.isActive) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Hotel not found or not available",
        };
        return;
      }

      // Check room availability
      if (hotel.availableRooms < bookingData.numberOfRooms) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Not enough rooms available",
          data: {
            requestedRooms: bookingData.numberOfRooms,
            availableRooms: hotel.availableRooms,
          },
        };
        return;
      }

      // Calculate total price
      const checkInDate = new Date(bookingData.checkInDate);
      const checkOutDate = new Date(bookingData.checkOutDate);
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)
      );
      const totalPrice =
        hotel.pricePerNight * bookingData.numberOfRooms * nights;

      // Create booking
      const booking = await Booking.create({
        ...bookingData,
        checkInDate: new Date(bookingData.checkInDate),
        checkOutDate: new Date(bookingData.checkOutDate),
        userId: ctx.user!.userId,
        totalPrice: totalPrice,
        currency: hotel.currency,
        status: "pending",
        paymentStatus: "pending",
      });

      // Update hotel availability
      await hotel.update({
        availableRooms: hotel.availableRooms - bookingData.numberOfRooms,
      });

      // Fetch complete booking with relations
      const completeBooking = await Booking.findByPk(booking.id, {
        include: [
          {
            model: Hotel,
            as: "hotel",
            attributes: ["id", "name", "city", "country", "starRating"],
          },
        ],
      });

      ctx.status = 201;
      ctx.body = {
        success: true,
        data: {
          ...completeBooking!.toJSON(),
          numberOfNights: nights,
        },
        message: "Booking created successfully",
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid booking data",
          errors: error.errors,
        };
        return;
      }

      console.error("Error creating booking:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // PUT /api/bookings/:id - Update booking
  static async updateBooking(ctx: Context) {
    try {
      const bookingId = parseInt(ctx.params.id);
      const updateData = updateBookingSchema.parse(ctx.request.body);

      if (isNaN(bookingId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid booking ID",
        };
        return;
      }

      const whereConditions: any = { id: bookingId };

      // Role-based access control
      if (!ctx.user?.isAdmin && !ctx.user?.isEmployee) {
        whereConditions.userId = ctx.user?.userId;
      }

      const booking = await Booking.findOne({ where: whereConditions });

      if (!booking) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Booking not found",
        };
        return;
      }

      // Prevent modification of completed or cancelled bookings (unless admin)
      if (
        !ctx.user?.isAdmin &&
        ["completed", "cancelled"].includes(booking.status)
      ) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Cannot modify completed or cancelled bookings",
        };
        return;
      }

      // Recalculate total price if dates or rooms changed
      if (
        updateData.checkInDate ||
        updateData.checkOutDate ||
        updateData.numberOfRooms
      ) {
        const hotel = await Hotel.findByPk(booking.hotelId);
        const checkInDate = new Date(
          updateData.checkInDate || booking.checkInDate
        );
        const checkOutDate = new Date(
          updateData.checkOutDate || booking.checkOutDate
        );
        const nights = Math.ceil(
          (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)
        );
        const rooms = updateData.numberOfRooms || booking.numberOfRooms;

        updateData.totalPrice = hotel!.pricePerNight * rooms * nights;
      }

      // Convert string dates to Date objects for update
      const finalUpdateData: any = { ...updateData };
      if (finalUpdateData.checkInDate) {
        finalUpdateData.checkInDate = new Date(finalUpdateData.checkInDate);
      }
      if (finalUpdateData.checkOutDate) {
        finalUpdateData.checkOutDate = new Date(finalUpdateData.checkOutDate);
      }

      await booking.update(finalUpdateData);

      ctx.body = {
        success: true,
        data: booking,
        message: "Booking updated successfully",
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid update data",
          errors: error.errors,
        };
        return;
      }

      console.error("Error updating booking:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // DELETE /api/bookings/:id - Cancel booking
  static async cancelBooking(ctx: Context) {
    try {
      const bookingId = parseInt(ctx.params.id);
      const { cancellationReason } = ctx.request.body as {
        cancellationReason?: string;
      };

      if (isNaN(bookingId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid booking ID",
        };
        return;
      }

      const whereConditions: any = { id: bookingId };

      // Role-based access control
      if (!ctx.user?.isAdmin && !ctx.user?.isEmployee) {
        whereConditions.userId = ctx.user?.userId;
      }

      const booking = await Booking.findOne({
        where: whereConditions,
        include: [{ model: Hotel, as: "hotel" }],
      });

      if (!booking) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Booking not found",
        };
        return;
      }

      if (!booking.canBeCancelled()) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "This booking cannot be cancelled",
        };
        return;
      }

      // Update booking status
      await booking.update({
        status: "cancelled",
        cancellationReason: cancellationReason || "Cancelled by user",
        cancellationDate: new Date(),
      });

      // Restore hotel room availability
      const hotel = (booking as any).hotel;
      if (hotel) {
        await hotel.update({
          availableRooms: hotel.availableRooms + booking.numberOfRooms,
        });
      }

      ctx.body = {
        success: true,
        message: "Booking cancelled successfully",
      };
    } catch (error) {
      console.error("Error cancelling booking:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/bookings/my - Get current user's bookings
  static async getMyBookings(ctx: Context) {
    try {
      const { status, page = 1, limit = 20 } = ctx.query;

      const whereConditions: any = {
        userId: ctx.user!.userId,
      };

      if (status) {
        whereConditions.status = status;
      }

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { count, rows: bookings } = await Booking.findAndCountAll({
        where: whereConditions,
        order: [["createdAt", "DESC"]],
        limit: parseInt(limit as string),
        offset: offset,
        include: [
          {
            model: Hotel,
            as: "hotel",
            attributes: [
              "id",
              "name",
              "city",
              "country",
              "starRating",
              "images",
            ],
          },
        ],
      });

      const bookingsWithDetails = bookings.map((booking) => {
        const bookingData = booking.toJSON();
        return {
          ...bookingData,
          numberOfNights: booking.getNumberOfNights(),
          isUpcoming: booking.isUpcoming(),
          isCurrentStay: booking.isCurrentStay(),
          isPastStay: booking.isPastStay(),
          canBeCancelled: booking.canBeCancelled(),
        };
      });

      ctx.body = {
        success: true,
        data: {
          bookings: bookingsWithDetails,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(count / parseInt(limit as string)),
            totalItems: count,
            itemsPerPage: parseInt(limit as string),
          },
        },
        message: `Found ${count} bookings`,
      };
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }
}
