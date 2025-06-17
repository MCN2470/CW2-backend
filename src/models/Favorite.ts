import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";

export interface FavoriteAttributes {
  id?: number;
  userId: number;
  hotelId: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Favorite
  extends Model<FavoriteAttributes>
  implements FavoriteAttributes
{
  public id!: number;
  public userId!: number;
  public hotelId!: number;
  public notes?: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public hasNotes(): boolean {
    return !!this.notes && this.notes.trim().length > 0;
  }

  public getFormattedDate(): string {
    return this.createdAt.toLocaleDateString();
  }
}

Favorite.init(
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500], // Reasonable note length
      },
    },
  },
  {
    sequelize,
    modelName: "Favorite",
    tableName: "favorites",
    timestamps: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["hotel_id"],
      },
      // Ensure one favorite per user per hotel
      {
        fields: ["user_id", "hotel_id"],
        unique: true,
      },
    ],
  }
);

export default Favorite;
