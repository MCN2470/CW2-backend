import { Model, DataTypes, Op } from "sequelize";
import { sequelize } from "../config/database";

export interface HotelAttributes {
  id?: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  starRating: number;
  pricePerNight: number;
  currency: string;
  amenities?: string[];
  images?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  hotelbedsId?: string; // External API reference
  isActive: boolean;
  totalRooms: number;
  availableRooms: number;
  phoneNumber?: string;
  email?: string;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Hotel extends Model<HotelAttributes> implements HotelAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public address!: string;
  public city!: string;
  public country!: string;
  public postalCode?: string;
  public latitude?: number;
  public longitude?: number;
  public starRating!: number;
  public pricePerNight!: number;
  public currency!: string;
  public amenities?: string[];
  public images?: string[];
  public checkInTime?: string;
  public checkOutTime?: string;
  public hotelbedsId?: string;
  public isActive!: boolean;
  public totalRooms!: number;
  public availableRooms!: number;
  public phoneNumber?: string;
  public email?: string;
  public website?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getFullAddress(): string {
    return `${this.address}, ${this.city}, ${this.country}`;
  }

  public isAvailable(): boolean {
    return this.isActive && this.availableRooms > 0;
  }

  public getStarRating(): string {
    return "*".repeat(Math.max(0, Math.min(5, this.starRating)));
  }

  public calculateTotalPrice(nights: number): number {
    return this.pricePerNight * nights;
  }
}

Hotel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        len: [1, 500],
      },
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180,
      },
    },
    starRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      validate: {
        min: 1,
        max: 5,
      },
    },
    pricePerNight: {
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
    amenities: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    checkInTime: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "15:00",
      validate: {
        is: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
    },
    checkOutTime: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "11:00",
      validate: {
        is: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
    },
    hotelbedsId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    totalRooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
      },
    },
    availableRooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 0,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
  },
  {
    sequelize,
    modelName: "Hotel",
    tableName: "hotels",
    timestamps: true,
    indexes: [
      {
        fields: ["city"],
      },
      {
        fields: ["country"],
      },
      {
        fields: ["star_rating"],
      },
      {
        fields: ["price_per_night"],
      },
      {
        fields: ["is_active"],
      },
      {
        fields: ["hotelbeds_id"],
        unique: true,
        where: {
          hotelbeds_id: {
            [Op.ne]: null,
          },
        },
      },
    ],
  }
);

export default Hotel;
