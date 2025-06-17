import axios from "axios";

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  currency?: string;
}

export interface Flight {
  id: string;
  airline: {
    name: string;
    code: string;
    logo?: string;
  };
  departure: {
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
  };
  cabinClass: string;
  bookingUrl?: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export class RapidApiService {
  private readonly apiKey =
    "89c54fa50emsh22a3b3155ab3a54p17f1dbjsn5fab363ae84d";
  private readonly baseUrl = "https://sky-scanner3.p.rapidapi.com";

  private getHeaders() {
    return {
      "X-RapidAPI-Key": this.apiKey,
      "X-RapidAPI-Host": "sky-scanner3.p.rapidapi.com",
      "Content-Type": "application/json",
    };
  }

  /**
   * Search for flights
   */
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/flights/search-roundtrip`,
        {
          headers: this.getHeaders(),
          params: {
            fromEntityId: params.origin,
            toEntityId: params.destination,
            departDate: params.departDate,
            returnDate: params.returnDate,
            adults: params.adults,
            children: params.children || 0,
            cabinClass: params.cabinClass || "economy",
            currency: params.currency || "USD",
          },
        }
      );

      return this.transformFlightData(response.data);
    } catch (error) {
      console.error("RapidAPI Flight Search Error:", error);
      return [];
    }
  }

  /**
   * Search for one-way flights
   */
  async searchOneWayFlights(
    params: Omit<FlightSearchParams, "returnDate">
  ): Promise<Flight[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/flights/search-oneway`,
        {
          headers: this.getHeaders(),
          params: {
            fromEntityId: params.origin,
            toEntityId: params.destination,
            departDate: params.departDate,
            adults: params.adults,
            children: params.children || 0,
            cabinClass: params.cabinClass || "economy",
            currency: params.currency || "USD",
          },
        }
      );

      return this.transformFlightData(response.data);
    } catch (error) {
      console.error("RapidAPI One-way Flight Search Error:", error);
      return [];
    }
  }

  /**
   * Search for airports by name or code
   */
  async searchAirports(query: string): Promise<Airport[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/flights/auto-complete`,
        {
          headers: this.getHeaders(),
          params: {
            query: query,
          },
        }
      );

      return this.transformAirportData(response.data);
    } catch (error) {
      console.error("RapidAPI Airport Search Error:", error);
      return [];
    }
  }

  /**
   * Get popular destinations from a city
   */
  async getPopularDestinations(
    fromCityCode: string
  ): Promise<Array<{ destination: string; price: number; currency: string }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/flights/popular-destinations`,
        {
          headers: this.getHeaders(),
          params: {
            fromEntityId: fromCityCode,
          },
        }
      );

      return (
        response.data.destinations?.map((dest: any) => ({
          destination: dest.name,
          price: dest.price?.amount || 0,
          currency: dest.price?.currency || "USD",
        })) || []
      );
    } catch (error) {
      console.error("RapidAPI Popular Destinations Error:", error);
      return [];
    }
  }

  /**
   * Get flight price alerts/trends
   */
  async getFlightPriceTrends(params: {
    origin: string;
    destination: string;
    departMonth: string;
  }): Promise<Array<{ date: string; price: number }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/flights/price-calendar`,
        {
          headers: this.getHeaders(),
          params: {
            fromEntityId: params.origin,
            toEntityId: params.destination,
            departMonth: params.departMonth,
          },
        }
      );

      return (
        response.data.prices?.map((price: any) => ({
          date: price.date,
          price: price.amount,
        })) || []
      );
    } catch (error) {
      console.error("RapidAPI Price Trends Error:", error);
      return [];
    }
  }

  /**
   * Transform flight API data to our format
   */
  private transformFlightData(data: any): Flight[] {
    if (!data.data?.flights) return [];

    return data.data.flights.map((flight: any) => ({
      id:
        flight.id ||
        `${flight.legs?.[0]?.origin}-${
          flight.legs?.[0]?.destination
        }-${Date.now()}`,
      airline: {
        name:
          flight.legs?.[0]?.carriers?.marketing?.[0]?.name || "Unknown Airline",
        code: flight.legs?.[0]?.carriers?.marketing?.[0]?.alternateId || "XX",
        logo: flight.legs?.[0]?.carriers?.marketing?.[0]?.logoUrl,
      },
      departure: {
        airport:
          flight.legs?.[0]?.origin?.name || flight.legs?.[0]?.origin?.id || "",
        time: flight.legs?.[0]?.departure?.split("T")[1]?.substring(0, 5) || "",
        date: flight.legs?.[0]?.departure?.split("T")[0] || "",
      },
      arrival: {
        airport:
          flight.legs?.[0]?.destination?.name ||
          flight.legs?.[0]?.destination?.id ||
          "",
        time: flight.legs?.[0]?.arrival?.split("T")[1]?.substring(0, 5) || "",
        date: flight.legs?.[0]?.arrival?.split("T")[0] || "",
      },
      duration: this.formatDuration(flight.legs?.[0]?.durationInMinutes || 0),
      stops: (flight.legs?.[0]?.segments?.length || 1) - 1,
      price: {
        amount: flight.price?.raw || 0,
        currency: flight.price?.currency || "USD",
      },
      cabinClass: flight.legs?.[0]?.segments?.[0]?.cabin || "economy",
      bookingUrl: flight.deeplink,
    }));
  }

  /**
   * Transform airport API data to our format
   */
  private transformAirportData(data: any): Airport[] {
    if (!data.data) return [];

    return data.data
      .filter((item: any) => item.navigation?.entityType === "AIRPORT")
      .map((airport: any) => ({
        code:
          airport.navigation?.localizedName?.split("(")[1]?.replace(")", "") ||
          airport.skyId,
        name:
          airport.navigation?.localizedName?.split("(")[0]?.trim() ||
          airport.suggestion,
        city: airport.hierarchy?.split(",")[0]?.trim() || "",
        country: airport.hierarchy?.split(",")[1]?.trim() || "",
      }));
  }

  /**
   * Format duration from minutes to human readable format
   */
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    }
    return `${hours}h ${mins}m`;
  }

  /**
   * Get nearby airports for a city
   */
  async getNearbyAirports(cityName: string): Promise<Airport[]> {
    const airports = await this.searchAirports(cityName);
    return airports.slice(0, 5); // Return top 5 results
  }

  /**
   * Get flight deals/offers
   */
  async getFlightDeals(origin?: string): Promise<
    Array<{
      destination: Airport;
      price: number;
      currency: string;
      departDate: string;
      returnDate?: string;
    }>
  > {
    try {
      // This would typically call a deals endpoint
      // For now, we'll return mock data structure
      return [];
    } catch (error) {
      console.error("RapidAPI Flight Deals Error:", error);
      return [];
    }
  }
}

export const rapidApiService = new RapidApiService();
