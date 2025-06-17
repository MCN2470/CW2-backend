import { Context } from "koa";
import { z } from "zod";
import { Hotel, Review, User } from "../models";
import { Op } from "sequelize";

// Validation schemas
const createHotelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  country: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  starRating: z.number().int().min(1).max(5),
  pricePerNight: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  checkInTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .default("15:00"),
  checkOutTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .default("11:00"),
  totalRooms: z.number().int().positive().default(10),
  availableRooms: z.number().int().min(0).default(10),
  phoneNumber: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  hotelbedsId: z.string().max(50).optional(),
});

const updateHotelSchema = createHotelSchema.partial();

const searchHotelSchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  minPrice: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .optional(),
  maxPrice: z
    .string()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .optional(),
  minStarRating: z
    .string()
    .transform((val) => (val ? parseInt(val) : undefined))
    .optional(),
  maxStarRating: z
    .string()
    .transform((val) => (val ? parseInt(val) : undefined))
    .optional(),
  amenities: z.array(z.string()).optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  guests: z
    .string()
    .transform((val) => (val ? parseInt(val) : 1))
    .default("1"),
  rooms: z
    .string()
    .transform((val) => (val ? parseInt(val) : 1))
    .default("1"),
  page: z
    .string()
    .transform((val) => (val ? parseInt(val) : 1))
    .default("1"),
  limit: z
    .string()
    .transform((val) => (val ? Math.min(parseInt(val), 100) : 20))
    .default("20"),
  sortBy: z.enum(["price", "rating", "name", "created"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export class HotelController {
  // GET /api/hotels - Get all hotels with search and filtering
  static async getAllHotels(ctx: Context) {
    try {
      const query = searchHotelSchema.parse(ctx.query);

      const whereConditions: any = {
        isActive: true,
      };

      // Apply filters
      if (query.city) {
        whereConditions.city = {
          [Op.iLike]: `%${query.city}%`,
        };
      }

      if (query.country) {
        whereConditions.country = {
          [Op.iLike]: `%${query.country}%`,
        };
      }

      if (query.minPrice || query.maxPrice) {
        whereConditions.pricePerNight = {};
        if (query.minPrice)
          whereConditions.pricePerNight[Op.gte] = query.minPrice;
        if (query.maxPrice)
          whereConditions.pricePerNight[Op.lte] = query.maxPrice;
      }

      if (query.minStarRating || query.maxStarRating) {
        whereConditions.starRating = {};
        if (query.minStarRating)
          whereConditions.starRating[Op.gte] = query.minStarRating;
        if (query.maxStarRating)
          whereConditions.starRating[Op.lte] = query.maxStarRating;
      }

      if (query.amenities && query.amenities.length > 0) {
        whereConditions.amenities = {
          [Op.contains]: query.amenities,
        };
      }

      // Room availability check
      if (query.rooms > 0) {
        whereConditions.availableRooms = {
          [Op.gte]: query.rooms,
        };
      }

      // Sorting
      let orderBy: any = [];
      switch (query.sortBy) {
        case "price":
          orderBy = [["pricePerNight", query.sortOrder]];
          break;
        case "rating":
          orderBy = [["starRating", query.sortOrder]];
          break;
        case "name":
          orderBy = [["name", query.sortOrder]];
          break;
        case "created":
          orderBy = [["createdAt", query.sortOrder]];
          break;
      }

      // Pagination
      const offset = (query.page - 1) * query.limit;

      const { count, rows: hotels } = await Hotel.findAndCountAll({
        where: whereConditions,
        order: orderBy,
        limit: query.limit,
        offset: offset,
        include: [
          {
            model: Review,
            as: "reviews",
            attributes: ["rating"],
            where: { isVisible: true },
            required: false,
          },
        ],
      });

      // Calculate average ratings
      const hotelsWithRatings = hotels.map((hotel) => {
        const hotelData = hotel.toJSON();
        const reviews = hotelData.reviews || [];
        const avgRating =
          reviews.length > 0
            ? reviews.reduce(
                (sum: number, r: any) => sum + parseFloat(r.rating),
                0
              ) / reviews.length
            : null;

        return {
          ...hotelData,
          averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          reviewCount: reviews.length,
          reviews: undefined, // Remove reviews from response
        };
      });

      ctx.body = {
        success: true,
        data: {
          hotels: hotelsWithRatings,
          pagination: {
            currentPage: query.page,
            totalPages: Math.ceil(count / query.limit),
            totalItems: count,
            itemsPerPage: query.limit,
          },
          filters: {
            city: query.city,
            country: query.country,
            priceRange:
              query.minPrice || query.maxPrice
                ? {
                    min: query.minPrice,
                    max: query.maxPrice,
                  }
                : null,
            starRating:
              query.minStarRating || query.maxStarRating
                ? {
                    min: query.minStarRating,
                    max: query.maxStarRating,
                  }
                : null,
            amenities: query.amenities,
          },
        },
        message: `Found ${count} hotels`,
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

      console.error("Error fetching hotels:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/hotels/:id - Get single hotel by ID
  static async getHotelById(ctx: Context) {
    try {
      const hotelId = parseInt(ctx.params.id);

      if (isNaN(hotelId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid hotel ID",
        };
        return;
      }

      const hotel = await Hotel.findByPk(hotelId, {
        include: [
          {
            model: Review,
            as: "reviews",
            where: { isVisible: true },
            required: false,
            include: [
              {
                model: require("../models").User,
                as: "user",
                attributes: ["firstName", "lastName"],
              },
            ],
          },
        ],
      });

      if (!hotel) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Hotel not found",
        };
        return;
      }

      if (!hotel.isActive) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Hotel is not available",
        };
        return;
      }

      const hotelData = hotel.toJSON();
      const reviews = hotelData.reviews || [];

      // Calculate rating statistics
      const avgRating =
        reviews.length > 0
          ? reviews.reduce(
              (sum: number, r: any) => sum + parseFloat(r.rating),
              0
            ) / reviews.length
          : null;

      const ratingDistribution = {
        5: reviews.filter((r: any) => r.rating >= 4.5).length,
        4: reviews.filter((r: any) => r.rating >= 3.5 && r.rating < 4.5).length,
        3: reviews.filter((r: any) => r.rating >= 2.5 && r.rating < 3.5).length,
        2: reviews.filter((r: any) => r.rating >= 1.5 && r.rating < 2.5).length,
        1: reviews.filter((r: any) => r.rating < 1.5).length,
      };

      ctx.body = {
        success: true,
        data: {
          ...hotelData,
          averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
          reviewCount: reviews.length,
          ratingDistribution,
          reviews: reviews.slice(0, 10), // Only return first 10 reviews
        },
        message: "Hotel retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching hotel:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // POST /api/hotels - Create new hotel (Admin/Employee only)
  static async createHotel(ctx: Context) {
    try {
      const hotelData = createHotelSchema.parse(ctx.request.body);

      // Check if hotel name already exists in the same city
      const existingHotel = await Hotel.findOne({
        where: {
          name: hotelData.name,
          city: hotelData.city,
          country: hotelData.country,
        },
      });

      if (existingHotel) {
        ctx.status = 409;
        ctx.body = {
          success: false,
          message: "Hotel with this name already exists in this city",
        };
        return;
      }

      const hotel = await Hotel.create(hotelData);

      ctx.status = 201;
      ctx.body = {
        success: true,
        data: hotel,
        message: "Hotel created successfully",
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid hotel data",
          errors: error.errors,
        };
        return;
      }

      console.error("Error creating hotel:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // PUT /api/hotels/:id - Update hotel (Admin/Employee only)
  static async updateHotel(ctx: Context) {
    try {
      const hotelId = parseInt(ctx.params.id);
      const updateData = updateHotelSchema.parse(ctx.request.body);

      if (isNaN(hotelId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid hotel ID",
        };
        return;
      }

      const hotel = await Hotel.findByPk(hotelId);

      if (!hotel) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Hotel not found",
        };
        return;
      }

      // Check for name conflicts if name is being updated
      if (updateData.name && updateData.name !== hotel.name) {
        const existingHotel = await Hotel.findOne({
          where: {
            name: updateData.name,
            city: updateData.city || hotel.city,
            country: updateData.country || hotel.country,
            id: { [Op.ne]: hotelId },
          },
        });

        if (existingHotel) {
          ctx.status = 409;
          ctx.body = {
            success: false,
            message: "Hotel with this name already exists in this city",
          };
          return;
        }
      }

      await hotel.update(updateData);

      ctx.body = {
        success: true,
        data: hotel,
        message: "Hotel updated successfully",
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

      console.error("Error updating hotel:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // DELETE /api/hotels/:id - Soft delete hotel (Admin only)
  static async deleteHotel(ctx: Context) {
    try {
      const hotelId = parseInt(ctx.params.id);

      if (isNaN(hotelId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid hotel ID",
        };
        return;
      }

      const hotel = await Hotel.findByPk(hotelId);

      if (!hotel) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Hotel not found",
        };
        return;
      }

      // Soft delete by setting isActive to false
      await hotel.update({ isActive: false });

      ctx.body = {
        success: true,
        message: "Hotel deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting hotel:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/hotels/:id/availability - Check room availability
  static async checkAvailability(ctx: Context) {
    try {
      const hotelId = parseInt(ctx.params.id);
      const { checkInDate, checkOutDate, rooms = 1 } = ctx.query;

      if (isNaN(hotelId)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid hotel ID",
        };
        return;
      }

      if (!checkInDate || !checkOutDate) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Check-in and check-out dates are required",
        };
        return;
      }

      const hotel = await Hotel.findByPk(hotelId);

      if (!hotel || !hotel.isActive) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Hotel not found",
        };
        return;
      }

      // Basic availability check (can be enhanced with actual booking conflicts)
      const requestedRooms = parseInt(rooms as string) || 1;
      const isAvailable = hotel.availableRooms >= requestedRooms;

      ctx.body = {
        success: true,
        data: {
          hotelId: hotel.id,
          hotelName: hotel.name,
          checkInDate,
          checkOutDate,
          requestedRooms,
          availableRooms: hotel.availableRooms,
          isAvailable,
          pricePerNight: hotel.pricePerNight,
          currency: hotel.currency,
          totalPrice:
            hotel.pricePerNight *
            requestedRooms *
            this.calculateNights(checkInDate as string, checkOutDate as string),
        },
        message: isAvailable ? "Rooms available" : "No rooms available",
      };
    } catch (error) {
      console.error("Error checking availability:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // Helper method to calculate nights
  private static calculateNights(checkIn: string, checkOut: string): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}
