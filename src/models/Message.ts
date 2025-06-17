import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database";

export interface MessageAttributes {
  id?: number;
  userId: number;
  employeeId?: number;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: "booking" | "payment" | "complaint" | "general" | "technical";
  isUserMessage: boolean;
  attachments?: string[];
  readByUser: boolean;
  readByEmployee: boolean;
  responseTime?: number; // in minutes
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Message
  extends Model<MessageAttributes>
  implements MessageAttributes
{
  public id!: number;
  public userId!: number;
  public employeeId?: number;
  public subject!: string;
  public message!: string;
  public status!: "open" | "in_progress" | "resolved" | "closed";
  public priority!: "low" | "medium" | "high" | "urgent";
  public category!:
    | "booking"
    | "payment"
    | "complaint"
    | "general"
    | "technical";
  public isUserMessage!: boolean;
  public attachments?: string[];
  public readByUser!: boolean;
  public readByEmployee!: boolean;
  public responseTime?: number;
  public resolvedAt?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public isOpen(): boolean {
    return this.status === "open";
  }

  public isResolved(): boolean {
    return this.status === "resolved" || this.status === "closed";
  }

  public isHighPriority(): boolean {
    return this.priority === "high" || this.priority === "urgent";
  }

  public needsAttention(): boolean {
    return this.isOpen() && this.isHighPriority();
  }

  public hasAttachments(): boolean {
    return Array.isArray(this.attachments) && this.attachments.length > 0;
  }

  public getResponseTimeFormatted(): string {
    if (!this.responseTime) return "N/A";

    if (this.responseTime < 60) {
      return `${this.responseTime} minutes`;
    } else if (this.responseTime < 1440) {
      return `${Math.round(this.responseTime / 60)} hours`;
    } else {
      return `${Math.round(this.responseTime / 1440)} days`;
    }
  }

  public getPriorityLevel(): number {
    const levels = { low: 1, medium: 2, high: 3, urgent: 4 };
    return levels[this.priority];
  }

  public markAsRead(isEmployee: boolean): void {
    if (isEmployee) {
      this.readByEmployee = true;
    } else {
      this.readByUser = true;
    }
  }
}

Message.init(
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
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000], // Reasonable message length
      },
    },
    status: {
      type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: false,
      defaultValue: "medium",
    },
    category: {
      type: DataTypes.ENUM(
        "booking",
        "payment",
        "complaint",
        "general",
        "technical"
      ),
      allowNull: false,
      defaultValue: "general",
    },
    isUserMessage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    readByUser: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readByEmployee: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    responseTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["employee_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["priority"],
      },
      {
        fields: ["category"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["read_by_user"],
      },
      {
        fields: ["read_by_employee"],
      },
    ],
  }
);

export default Message;
