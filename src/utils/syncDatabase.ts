import { sequelize } from "../config/database";
import {
  User,
  Hotel,
  Booking,
  Review,
  Favorite,
  Message,
  initializeAssociations,
} from "../models";
import { hashPassword } from "./auth";

const createDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Initialize model associations
    initializeAssociations();

    // Sync all models (create tables)
    await sequelize.sync({
      force: false, // Set to true to drop existing tables
      alter: true, // Update table structure if needed
    });
    console.log("✅ All models synchronized successfully");

    // Create sample data
    await createSampleData();

    console.log("✅ Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Unable to set up database:", error);
  }
};

const createSampleData = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: "admin@wanderlust.com" },
    });

    if (!existingAdmin) {
      // Create admin user
      await User.create({
        firstName: "Admin",
        lastName: "User",
        email: "admin@wanderlust.com",
        password: await hashPassword("password123"),
        role: "admin",
        isVerified: true,
      });
      console.log("✅ Admin user created");
    }

    // Check if sample hotel exists
    const existingHotel = await Hotel.findOne({
      where: { name: "Grand Wanderlust Hotel" },
    });

    if (!existingHotel) {
      // Create sample hotel
      const sampleHotel = await Hotel.create({
        name: "Grand Wanderlust Hotel",
        description:
          "A luxurious 5-star hotel in the heart of the city with world-class amenities and exceptional service.",
        address: "123 Main Street",
        city: "New York",
        country: "United States",
        postalCode: "10001",
        latitude: 40.7589,
        longitude: -73.9851,
        starRating: 5,
        pricePerNight: 299.99,
        currency: "USD",
        amenities: [
          "Free WiFi",
          "Swimming Pool",
          "Fitness Center",
          "Spa",
          "Restaurant",
          "Room Service",
          "Business Center",
          "Concierge Service",
          "Valet Parking",
          "Pet Friendly",
        ],
        images: [
          "https://example.com/hotel1.jpg",
          "https://example.com/hotel2.jpg",
          "https://example.com/hotel3.jpg",
        ],
        checkInTime: "15:00",
        checkOutTime: "11:00",
        isActive: true,
        totalRooms: 150,
        availableRooms: 120,
        phoneNumber: "+1-555-123-4567",
        email: "info@grandwanderlust.com",
        website: "https://grandwanderlust.com",
      });
      console.log("✅ Sample hotel created");

      // Create another sample hotel
      await Hotel.create({
        name: "Seaside Resort & Spa",
        description:
          "Beautiful beachfront resort with stunning ocean views and relaxing spa treatments.",
        address: "456 Ocean Drive",
        city: "Miami",
        country: "United States",
        postalCode: "33139",
        latitude: 25.7617,
        longitude: -80.1918,
        starRating: 4,
        pricePerNight: 199.99,
        currency: "USD",
        amenities: [
          "Free WiFi",
          "Beach Access",
          "Swimming Pool",
          "Spa",
          "Restaurant",
          "Bar",
          "Water Sports",
          "Beach Volleyball",
        ],
        images: [
          "https://example.com/resort1.jpg",
          "https://example.com/resort2.jpg",
        ],
        checkInTime: "15:00",
        checkOutTime: "11:00",
        isActive: true,
        totalRooms: 85,
        availableRooms: 65,
        phoneNumber: "+1-555-987-6543",
        email: "info@seasideresort.com",
        website: "https://seasideresort.com",
      });
      console.log("✅ Additional sample hotel created");
    }

    console.log("✅ Sample data setup completed");
  } catch (error) {
    console.error("❌ Error creating sample data:", error);
  }
};

const dropAllTables = async () => {
  try {
    await sequelize.drop();
    console.log("✅ All tables dropped successfully");
  } catch (error) {
    console.error("❌ Error dropping tables:", error);
  }
};

// Export functions for use in other scripts
export { createDatabase, createSampleData, dropAllTables };

// Run if called directly
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log("✅ Database sync completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database sync failed:", error);
      process.exit(1);
    });
}
