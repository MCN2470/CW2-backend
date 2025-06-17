import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";

export interface BookingAttributes {
  id?: number;
  userId: number;
  hotelId: number;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  numberOfRooms: number;
  totalPrice: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  specialRequests?: string;
  guestNames?: string[];
  contactEmail: string;
  contactPhone?: string;
  bookingReference: string;
  cancellationReason?: string;
  cancellationDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Booking
  extends Model<BookingAttributes>
  implements BookingAttributes
{
  public id!: number;
  public userId!: number;
  public hotelId!: number;
  public checkInDate!: Date;
  public checkOutDate!: Date;
  public numberOfGuests!: number;
  public numberOfRooms!: number;
  public totalPrice!: number;
  public currency!: string;
  public status!: "pending" | "confirmed" | "cancelled" | "completed";
  public paymentStatus!: "pending" | "paid" | "failed" | "refunded";
  public paymentMethod?: string;
  public specialRequests?: string;
  public guestNames?: string[];
  public contactEmail!: string;
  public contactPhone?: string;
  public bookingReference!: string;
  public cancellationReason?: string;
  public cancellationDate?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getNumberOfNights(): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(
      (this.checkOutDate.getTime() - this.checkInDate.getTime()) / oneDay
    );
  }

  public isActive(): boolean {
    return this.status === "confirmed" || this.status === "pending";
  }

  public canBeCancelled(): boolean {
    return this.status === "confirmed" || this.status === "pending";
  }

  public isPaid(): boolean {
    return this.paymentStatus === "paid";
  }

  public getTotalGuests(): number {
    return this.numberOfGuests;
  }

  public isUpcoming(): boolean {
    return this.checkInDate > new Date();
  }

  public isCurrentStay(): boolean {
    const now = new Date();
    return this.checkInDate <= now && this.checkOutDate > now;
  }

  public isPastStay(): boolean {
    return this.checkOutDate < new Date();
  }
}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    hotelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "hotels",
        key: "id",
      },
    },
    checkInDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date().toISOString().split("T")[0], // Must be today or future
      },
    },
    checkOutDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterCheckIn(value: string) {
          if (value <= (this as any).checkInDate) {
            throw new Error("Check-out date must be after check-in date");
          }
        },
      },
    },
    numberOfGuests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 20, // Reasonable limit
      },
    },
    numberOfRooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 10, // Reasonable limit
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "USD",
      validate: {
        len: [3, 3],
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
      allowNull: false,
      defaultValue: "pending",
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    guestNames: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    bookingReference: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancellationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "bookings",
    timestamps: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["hotel_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["payment_status"],
      },
      {
        fields: ["check_in_date"],
      },
      {
        fields: ["check_out_date"],
      },
      {
        fields: ["booking_reference"],
        unique: true,
      },
    ],
    hooks: {
      beforeCreate: (booking: Booking) => {
        // Generate unique booking reference
        if (!booking.bookingReference) {
          const timestamp = Date.now().toString(36);
          const random = Math.random().toString(36).substring(2, 8);
          booking.bookingReference = `WL${timestamp}${random}`.toUpperCase();
        }
      },
    },
  }
);

export default Booking;
