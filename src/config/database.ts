import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const environment = process.env.NODE_ENV || "development";

// Create Sequelize instance with conditional configuration
const createSequelizeInstance = (): Sequelize => {
  const database =
    environment === "test"
      ? process.env.DB_NAME_TEST || "wanderlust_travel_test"
      : process.env.DB_NAME || "wanderlust_travel";

  const username = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306");

  const options: any = {
    host,
    port,
    dialect: "mysql",
    logging: environment === "development" ? console.log : false,
    pool: {
      max: environment === "production" ? 20 : 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: "+00:00",
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true, // Enable soft deletes
      freezeTableName: true,
    },
  };

  // Add SSL configuration for production
  if (environment === "production" && process.env.DB_SSL === "true") {
    options.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    };
  }

  return new Sequelize(database, username, password, options);
};

export const sequelize = createSequelizeInstance();

// Test connection function
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    return false;
  }
};

// Database initialization function
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error("Failed to connect to database");
    }

    // Sync models (only in development)
    if (environment === "development") {
      await sequelize.sync({ alter: true });
      console.log("Database models synchronized.");
    } else if (environment === "test") {
      await sequelize.sync({ force: true });
      console.log("Test database reset and synchronized.");
    }
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

export default sequelize;
