import User from "./User";
import Hotel from "./Hotel";
import Booking from "./Booking";
import Review from "./Review";
import Favorite from "./Favorite";
import Message from "./Message";

// Define all model associations
export const initializeAssociations = () => {
  // User associations
  User.hasMany(Booking, { foreignKey: "userId", as: "bookings" });
  User.hasMany(Review, { foreignKey: "userId", as: "reviews" });
  User.hasMany(Favorite, { foreignKey: "userId", as: "favorites" });
  User.hasMany(Message, { foreignKey: "userId", as: "userMessages" });
  User.hasMany(Message, { foreignKey: "employeeId", as: "employeeMessages" });

  // Hotel associations
  Hotel.hasMany(Booking, { foreignKey: "hotelId", as: "bookings" });
  Hotel.hasMany(Review, { foreignKey: "hotelId", as: "reviews" });
  Hotel.hasMany(Favorite, { foreignKey: "hotelId", as: "favorites" });

  // Booking associations
  Booking.belongsTo(User, { foreignKey: "userId", as: "user" });
  Booking.belongsTo(Hotel, { foreignKey: "hotelId", as: "hotel" });
  Booking.hasMany(Review, { foreignKey: "bookingId", as: "reviews" });

  // Review associations
  Review.belongsTo(User, { foreignKey: "userId", as: "user" });
  Review.belongsTo(Hotel, { foreignKey: "hotelId", as: "hotel" });
  Review.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });

  // Favorite associations
  Favorite.belongsTo(User, { foreignKey: "userId", as: "user" });
  Favorite.belongsTo(Hotel, { foreignKey: "hotelId", as: "hotel" });

  // Message associations
  Message.belongsTo(User, { foreignKey: "userId", as: "user" });
  Message.belongsTo(User, { foreignKey: "employeeId", as: "employee" });

  console.log("Model associations initialized successfully");
};

export { User, Hotel, Booking, Review, Favorite, Message };
