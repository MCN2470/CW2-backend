import axios from "axios";
import crypto from "crypto";

export interface HotelbedsHotel {
  code: number;
  name: string;
  description?: string;
  city: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  category?: number;
  images?: string[];
  amenities?: string[];
  address?: string;
}

export interface HotelbedsAvailability {
  hotelCode: number;
  hotelName: string;
  currency: string;
  rooms: Array<{
    roomCode: string;
    roomName: string;
    rateKey: string;
    net: number;
    adults: number;
    children: number;
  }>;
}

export interface HotelSearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  language?: string;
}

export class HotelbedsService {
  private readonly apiKey = "7fb6c6f3831199a80f1d4e369b5bcaca";
  private readonly sharedSecret = "your_shared_secret"; // You would need this from Hotelbeds
  private readonly baseUrl = "https://api.test.hotelbeds.com";

  private generateSignature(timestamp: string): string {
    const stringToSign = this.apiKey + this.sharedSecret + timestamp;
    return crypto.createHash("sha256").update(stringToSign).digest("hex");
  }

  private getHeaders() {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(timestamp);

    return {
      "Api-key": this.apiKey,
      "X-Signature": signature,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Search for hotels by destination
   */
  async searchHotels(params: HotelSearchParams): Promise<HotelbedsHotel[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/hotel-api/1.0/hotels`,
        {
          stay: {
            checkIn: params.checkIn,
            checkOut: params.checkOut,
          },
          occupancies: [
            {
              rooms: params.rooms || 1,
              adults: params.adults,
              children: params.children || 0,
            },
          ],
          destination: {
            code: params.destination,
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      return this.transformHotelData(response.data.hotels?.hotels || []);
    } catch (error) {
      console.error("Hotelbeds API Error:", error);
      // Return empty array instead of throwing to allow fallback to local data
      return [];
    }
  }

  /**
   * Get hotel availability and pricing
   */
  async getHotelAvailability(
    hotelCode: number,
    params: HotelSearchParams
  ): Promise<HotelbedsAvailability | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/hotel-api/1.0/hotels`,
        {
          stay: {
            checkIn: params.checkIn,
            checkOut: params.checkOut,
          },
          occupancies: [
            {
              rooms: params.rooms || 1,
              adults: params.adults,
              children: params.children || 0,
            },
          ],
          hotels: {
            hotel: [hotelCode],
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      const hotel = response.data.hotels?.hotels?.[0];
      if (!hotel) return null;

      return {
        hotelCode: hotel.code,
        hotelName: hotel.name,
        currency: hotel.currency,
        rooms:
          hotel.rooms?.map((room: any) => ({
            roomCode: room.code,
            roomName: room.name,
            rateKey: room.rates?.[0]?.rateKey || "",
            net: room.rates?.[0]?.net || 0,
            adults: room.rates?.[0]?.adults || params.adults,
            children: room.rates?.[0]?.children || params.children || 0,
          })) || [],
      };
    } catch (error) {
      console.error("Hotelbeds Availability Error:", error);
      return null;
    }
  }

  /**
   * Get detailed hotel information
   */
  async getHotelDetails(hotelCode: number): Promise<HotelbedsHotel | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/hotel-content-api/1.0/hotels/${hotelCode}/details`,
        {
          headers: this.getHeaders(),
        }
      );

      const hotel = response.data.hotel;
      if (!hotel) return null;

      return this.transformHotelData([hotel])[0] || null;
    } catch (error) {
      console.error("Hotelbeds Hotel Details Error:", error);
      return null;
    }
  }

  /**
   * Get destinations (cities/regions) for search
   */
  async getDestinations(
    searchTerm?: string
  ): Promise<Array<{ code: string; name: string; country: string }>> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/hotel-content-api/1.0/locations/destinations`,
        {
          headers: this.getHeaders(),
          params: {
            fields: "all",
            language: "ENG",
            from: 1,
            to: 100,
          },
        }
      );

      const destinations = response.data.destinations || [];

      return destinations
        .filter(
          (dest: any) =>
            !searchTerm ||
            dest.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dest.countryName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((dest: any) => ({
          code: dest.code,
          name: dest.name,
          country: dest.countryName,
        }));
    } catch (error) {
      console.error("Hotelbeds Destinations Error:", error);
      return [];
    }
  }

  /**
   * Transform Hotelbeds API data to our format
   */
  private transformHotelData(hotels: any[]): HotelbedsHotel[] {
    return hotels.map((hotel: any) => ({
      code: hotel.code,
      name: hotel.name,
      description: hotel.description?.content || "",
      city: hotel.destination?.name || "",
      country: hotel.destination?.countryName || "",
      coordinates: hotel.coordinates
        ? {
            latitude: parseFloat(hotel.coordinates.latitude),
            longitude: parseFloat(hotel.coordinates.longitude),
          }
        : undefined,
      category: hotel.categoryCode || hotel.category?.code,
      images: hotel.images?.map((img: any) => img.path) || [],
      amenities:
        hotel.facilities?.map(
          (facility: any) => facility.description?.content
        ) || [],
      address: hotel.address?.content || "",
    }));
  }

  /**
   * Sync Hotelbeds hotel data with our local database
   */
  async syncHotelData(
    destinationCode: string
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      // Search for hotels in the destination
      const hotels = await this.searchHotels({
        destination: destinationCode,
        checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 30 days from now
        checkOut: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 32 days from now
        adults: 2,
      });

      for (const hotelData of hotels) {
        try {
          // Here you would save to your local database
          // This is a placeholder - you'd implement the actual database save logic
          console.log(
            `Would sync hotel: ${hotelData.name} (${hotelData.code})`
          );
          synced++;
        } catch (error) {
          console.error(`Error syncing hotel ${hotelData.code}:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error("Error during hotel sync:", error);
      errors++;
    }

    return { synced, errors };
  }
}

export const hotelbedsService = new HotelbedsService();
