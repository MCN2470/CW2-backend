import { Model, DataTypes, Op } from "sequelize";
import { sequelize } from "../config/database";

export interface ReviewAttributes {
  id?: number;
  userId: number;
  hotelId: number;
  bookingId?: number;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  isVisible: boolean;
  helpfulVotes: number;
  responseFromHotel?: string;
  responseDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Review
  extends Model<ReviewAttributes>
  implements ReviewAttributes
{
  public id!: number;
  public userId!: number;
  public hotelId!: number;
  public bookingId?: number;
  public rating!: number;
  public title?: string;
  public comment?: string;
  public isVerified!: boolean;
  public isVisible!: boolean;
  public helpfulVotes!: number;
  public responseFromHotel?: string;
  public responseDate?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getStarRating(): string {
    return "*".repeat(Math.max(0, Math.min(5, this.rating)));
  }

  public isExcellent(): boolean {
    return this.rating >= 4.5;
  }

  public isGood(): boolean {
    return this.rating >= 3.5;
  }

  public isAverage(): boolean {
    return this.rating >= 2.5;
  }

  public isPoor(): boolean {
    return this.rating < 2.5;
  }

  public hasHotelResponse(): boolean {
    return !!this.responseFromHotel;
  }

  public canBeEdited(): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.createdAt > oneWeekAgo;
  }
}

Review.init(
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
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "bookings",
        key: "id",
      },
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255],
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000], // Reasonable comment length
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    helpfulVotes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    responseFromHotel: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responseDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Review",
    tableName: "reviews",
    timestamps: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["hotel_id"],
      },
      {
        fields: ["booking_id"],
      },
      {
        fields: ["rating"],
      },
      {
        fields: ["is_visible"],
      },
      {
        fields: ["is_verified"],
      },
      {
        fields: ["created_at"],
      },
      // Ensure one review per booking (if booking exists)
      {
        fields: ["user_id", "hotel_id", "booking_id"],
        unique: true,
        where: {
          booking_id: {
            [Op.ne]: null,
          },
        },
      },
    ],
  }
);

export default Review;
