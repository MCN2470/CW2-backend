import dotenv from "dotenv";
import { sequelize } from "../config/database";

// Load environment variables
dotenv.config();

async function checkDatabase() {
  try {
    console.log("Checking database status...");

    // Test connection
    await sequelize.authenticate();
    console.log("Database connection successful!");

    // Check what tables exist
    const [results] = await sequelize.query("SHOW TABLES;");
    console.log("Tables in database:", results);

    // If users table exists, check its structure
    if (results.length > 0) {
      const [tableInfo] = await sequelize.query("DESCRIBE users;");
      console.log("Users table structure:", tableInfo);

      // Check user count
      const [userCount] = await sequelize.query(
        "SELECT COUNT(*) as count FROM users;"
      );
      console.log("Number of users in database:", userCount);

      // Show first few users (without passwords)
      const [users] = await sequelize.query(
        "SELECT id, email, first_name, last_name, role, is_verified FROM users LIMIT 5;"
      );
      console.log("Sample users:", users);
    } else {
      console.log("No tables found in database!");
    }
  } catch (error) {
    console.error("Database check failed:", error);
  } finally {
    await sequelize.close();
    console.log("Database connection closed");
  }
}

checkDatabase();
