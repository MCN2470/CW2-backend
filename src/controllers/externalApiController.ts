import { Context } from "koa";
import { z } from "zod";
import { hotelbedsService } from "../services/hotelbedsService";
import { rapidApiService } from "../services/rapidApiService";

// Validation schemas
const flightSearchSchema = z.object({
  origin: z.string().min(3, "Origin airport code required"),
  destination: z.string().min(3, "Destination airport code required"),
  departDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .optional(),
  adults: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .default("1"),
  children: z
    .string()
    .transform((val) => parseInt(val) || 0)
    .default("0"),
  cabinClass: z
    .enum(["economy", "premium_economy", "business", "first"])
    .default("economy"),
  currency: z.string().default("USD"),
});

const airportSearchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
});

const destinationSearchSchema = z.object({
  destination: z.string().min(2, "Destination required"),
  checkIn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-in date format"),
  checkOut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid check-out date format"),
  adults: z
    .string()
    .transform((val) => parseInt(val) || 2)
    .default("2"),
  children: z
    .string()
    .transform((val) => parseInt(val) || 0)
    .default("0"),
  rooms: z
    .string()
    .transform((val) => parseInt(val) || 1)
    .default("1"),
});

export class ExternalApiController {
  // GET /api/external/flights/search - Search flights
  static async searchFlights(ctx: Context) {
    try {
      const query = flightSearchSchema.parse(ctx.query);

      const flights = await rapidApiService.searchFlights({
        origin: query.origin,
        destination: query.destination,
        departDate: query.departDate,
        returnDate: query.returnDate,
        adults: query.adults,
        children: query.children,
        cabinClass: query.cabinClass,
        currency: query.currency,
      });

      ctx.body = {
        success: true,
        data: {
          flights,
          searchParams: {
            origin: query.origin,
            destination: query.destination,
            departDate: query.departDate,
            returnDate: query.returnDate,
            passengers: {
              adults: query.adults,
              children: query.children,
            },
            cabinClass: query.cabinClass,
            currency: query.currency,
          },
          resultsCount: flights.length,
        },
        message: `Found ${flights.length} flights`,
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

      console.error("Error searching flights:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/flights/oneway - Search one-way flights
  static async searchOneWayFlights(ctx: Context) {
    try {
      const query = flightSearchSchema
        .omit({ returnDate: true })
        .parse(ctx.query);

      const flights = await rapidApiService.searchOneWayFlights({
        origin: query.origin,
        destination: query.destination,
        departDate: query.departDate,
        adults: query.adults,
        children: query.children,
        cabinClass: query.cabinClass,
        currency: query.currency,
      });

      ctx.body = {
        success: true,
        data: {
          flights,
          searchParams: {
            origin: query.origin,
            destination: query.destination,
            departDate: query.departDate,
            passengers: {
              adults: query.adults,
              children: query.children,
            },
            cabinClass: query.cabinClass,
            currency: query.currency,
          },
          resultsCount: flights.length,
        },
        message: `Found ${flights.length} one-way flights`,
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

      console.error("Error searching one-way flights:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/airports/search - Search airports
  static async searchAirports(ctx: Context) {
    try {
      const query = airportSearchSchema.parse(ctx.query);

      const airports = await rapidApiService.searchAirports(query.query);

      ctx.body = {
        success: true,
        data: {
          airports,
          query: query.query,
          resultsCount: airports.length,
        },
        message: `Found ${airports.length} airports`,
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

      console.error("Error searching airports:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/destinations/popular - Get popular destinations
  static async getPopularDestinations(ctx: Context) {
    try {
      const { from } = ctx.query;

      if (!from || typeof from !== "string") {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Origin city code is required",
        };
        return;
      }

      const destinations = await rapidApiService.getPopularDestinations(from);

      ctx.body = {
        success: true,
        data: {
          destinations,
          from,
          resultsCount: destinations.length,
        },
        message: `Found ${destinations.length} popular destinations`,
      };
    } catch (error) {
      console.error("Error getting popular destinations:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/hotels/search - Search external hotels
  static async searchExternalHotels(ctx: Context) {
    try {
      const query = destinationSearchSchema.parse(ctx.query);

      const hotels = await hotelbedsService.searchHotels({
        destination: query.destination,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        adults: query.adults,
        children: query.children,
        rooms: query.rooms,
      });

      ctx.body = {
        success: true,
        data: {
          hotels,
          searchParams: {
            destination: query.destination,
            checkIn: query.checkIn,
            checkOut: query.checkOut,
            guests: {
              adults: query.adults,
              children: query.children,
            },
            rooms: query.rooms,
          },
          resultsCount: hotels.length,
        },
        message: `Found ${hotels.length} external hotels`,
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

      console.error("Error searching external hotels:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/hotels/destinations - Get hotel destinations
  static async getHotelDestinations(ctx: Context) {
    try {
      const { search } = ctx.query;

      const destinations = await hotelbedsService.getDestinations(
        search ? String(search) : undefined
      );

      ctx.body = {
        success: true,
        data: {
          destinations,
          searchTerm: search || null,
          resultsCount: destinations.length,
        },
        message: `Found ${destinations.length} destinations`,
      };
    } catch (error) {
      console.error("Error getting hotel destinations:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/hotels/:code/availability - Get external hotel availability
  static async getExternalHotelAvailability(ctx: Context) {
    try {
      const hotelCode = parseInt(ctx.params.code);
      const query = destinationSearchSchema
        .omit({ destination: true })
        .parse(ctx.query);

      if (isNaN(hotelCode)) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Invalid hotel code",
        };
        return;
      }

      const availability = await hotelbedsService.getHotelAvailability(
        hotelCode,
        {
          destination: "", // Not needed for specific hotel
          checkIn: query.checkIn,
          checkOut: query.checkOut,
          adults: query.adults,
          children: query.children,
          rooms: query.rooms,
        }
      );

      if (!availability) {
        ctx.status = 404;
        ctx.body = {
          success: false,
          message: "Hotel availability not found",
        };
        return;
      }

      ctx.body = {
        success: true,
        data: {
          availability,
          searchParams: {
            hotelCode,
            checkIn: query.checkIn,
            checkOut: query.checkOut,
            guests: {
              adults: query.adults,
              children: query.children,
            },
            rooms: query.rooms,
          },
        },
        message: "Hotel availability retrieved successfully",
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

      console.error("Error getting hotel availability:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/price-trends - Get flight price trends
  static async getFlightPriceTrends(ctx: Context) {
    try {
      const { origin, destination, month } = ctx.query;

      if (!origin || !destination || !month) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Origin, destination, and month are required",
        };
        return;
      }

      const trends = await rapidApiService.getFlightPriceTrends({
        origin: String(origin),
        destination: String(destination),
        departMonth: String(month),
      });

      ctx.body = {
        success: true,
        data: {
          trends,
          params: {
            origin,
            destination,
            month,
          },
          resultsCount: trends.length,
        },
        message: `Found price trends for ${trends.length} dates`,
      };
    } catch (error) {
      console.error("Error getting price trends:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // POST /api/external/sync-hotels - Sync hotel data from external API
  static async syncHotelData(ctx: Context) {
    try {
      const { destinationCode } = ctx.request.body as {
        destinationCode: string;
      };

      if (!destinationCode) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: "Destination code is required",
        };
        return;
      }

      const result = await hotelbedsService.syncHotelData(destinationCode);

      ctx.body = {
        success: true,
        data: result,
        message: `Sync completed: ${result.synced} hotels synced, ${result.errors} errors`,
      };
    } catch (error) {
      console.error("Error syncing hotel data:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }

  // GET /api/external/combined/search - Combined search (hotels + flights)
  static async combinedSearch(ctx: Context) {
    try {
      const {
        destination,
        origin,
        checkIn,
        checkOut,
        adults = "2",
        children = "0",
        rooms = "1",
      } = ctx.query;

      if (!destination || !origin || !checkIn || !checkOut) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message:
            "Destination, origin, check-in, and check-out dates are required",
        };
        return;
      }

      // Search hotels and flights in parallel
      const [hotels, flights] = await Promise.all([
        hotelbedsService.searchHotels({
          destination: String(destination),
          checkIn: String(checkIn),
          checkOut: String(checkOut),
          adults: parseInt(String(adults)) || 2,
          children: parseInt(String(children)) || 0,
          rooms: parseInt(String(rooms)) || 1,
        }),
        rapidApiService.searchFlights({
          origin: String(origin),
          destination: String(destination),
          departDate: String(checkIn),
          returnDate: String(checkOut),
          adults: parseInt(String(adults)) || 2,
          children: parseInt(String(children)) || 0,
        }),
      ]);

      ctx.body = {
        success: true,
        data: {
          hotels,
          flights,
          searchParams: {
            destination,
            origin,
            checkIn,
            checkOut,
            adults: parseInt(String(adults)) || 2,
            children: parseInt(String(children)) || 0,
            rooms: parseInt(String(rooms)) || 1,
          },
          summary: {
            hotelsFound: hotels.length,
            flightsFound: flights.length,
          },
        },
        message: `Found ${hotels.length} hotels and ${flights.length} flights`,
      };
    } catch (error) {
      console.error("Error in combined search:", error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Internal server error",
      };
    }
  }
}
