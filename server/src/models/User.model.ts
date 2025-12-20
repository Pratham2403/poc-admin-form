import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole } from '@poc-admin-form/shared';

export interface IUserDocument extends Omit<IUser, '_id'>, Document { }

const ModulePermissionsSchema = new Schema({
    users: { type: Boolean, default: false },
    forms: { type: Boolean, default: false }
}, { _id: false });

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    name: { type: String },
    address: { type: String },
    city: { type: String },
    employeeId: { type: String },
    vendorId: { type: String },
    lastHeartbeat: { type: Date },
    modulePermissions: { type: ModulePermissionsSchema }
}, { timestamps: true });

export default mongoose.model<IUserDocument>('User', UserSchema);
