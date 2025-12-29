import { UserRole } from "../enums/UserRole.enum.ts";
import { UserStatus } from "../enums/UserStatus.enum.ts";

export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  role: UserRole;
  status?: UserStatus;
  name?: string;
  address?: string;
  city?: string;
  employeeId?: string;
  vendorId?: string;
  lastHeartbeat?: Date;
  modulePermissions?: {
    users: boolean;
    forms: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
