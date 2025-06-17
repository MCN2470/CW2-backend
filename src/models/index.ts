export { default as User } from "./User";
export { default as Hotel } from "./Hotel";
export { default as Booking } from "./Booking";
export { default as Review } from "./Review";
export { default as Favorite } from "./Favorite";
export { default as Message } from "./Message";

export { initializeAssociations } from "./associations";

// Re-export all model classes and interfaces
export type { UserAttributes } from "./User";
export type { HotelAttributes } from "./Hotel";
export type { BookingAttributes } from "./Booking";
export type { ReviewAttributes } from "./Review";
export type { FavoriteAttributes } from "./Favorite";
export type { MessageAttributes } from "./Message";
