import { UserRole } from '../enums/UserRole.enum.ts';

export interface IUser {
    _id?: string;
    email: string;
    password?: string;
    role: UserRole;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
