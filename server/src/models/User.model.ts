import mongoose, { Schema, Document } from 'mongoose';
import { IUser, UserRole } from '@poc-admin-form/shared';

export interface IUserDocument extends Omit<IUser, '_id'>, Document { }

const UserSchema: Schema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    name: { type: String },
}, { timestamps: true });

export default mongoose.model<IUserDocument>('User', UserSchema);
