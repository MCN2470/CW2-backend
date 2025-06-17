import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import { sequelize } from "../config/database";
import User from "../models/User";

// Load environment variables
dotenv.config();

async function syncDatabase() {
  try {
    console.log("Starting database synchronization...");

    // First, connect without specifying database to create it
    console.log("Connecting to MySQL server...");
    const baseSequelize = new Sequelize(
      "",
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "127.0.0.1",
        port: parseInt(process.env.DB_PORT || "3306"),
        dialect: "mysql",
        logging: false,
      }
    );

    await baseSequelize.authenticate();
    console.log("Connected to MySQL server!");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "wanderlust_travel";
    console.log(`Creating database '${dbName}' if it doesn't exist...`);
    await baseSequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log("Database created/verified!");

    await baseSequelize.close();

    // Now use our configured sequelize instance
    console.log("Connecting to wanderlust_travel database...");
    await sequelize.authenticate();
    console.log("Database connection successful!");

    // Sync models (create tables)
    console.log("Synchronizing database models...");
    await sequelize.sync({ force: false });
    console.log("Database models synchronized!");

    // Create test admin user if not exists
    const adminEmail = "admin@wanderlust.com";
    console.log("Checking for existing admin user...");
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      console.log("Creating default admin user...");
      await User.create({
        email: adminEmail,
        password: "password123", // Will be hashed in production
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isVerified: true,
      });
      console.log("Default admin user created!");
      console.log("Email: admin@wanderlust.com");
      console.log("Password: password123");
    } else {
      console.log("Admin user already exists");
    }

    console.log("\nDatabase setup completed successfully!");
    console.log("Connection details:");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
  } catch (error) {
    console.error("Database synchronization failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log("Database connection closed");
    process.exit(0);
  }
}

// Run the sync
syncDatabase();
