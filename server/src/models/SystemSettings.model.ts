import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemSettingsDocument extends Document {
    heartbeat_window: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ISystemSettingsModel extends Model<ISystemSettingsDocument> {
    getSettings(): Promise<ISystemSettingsDocument>;
    updateSettings(data: Partial<ISystemSettingsDocument>): Promise<ISystemSettingsDocument>;
}

const SystemSettingsSchema: Schema = new Schema({
    heartbeat_window: { 
        type: Number, 
        required: true,
        default: parseFloat(process.env.HEARTBEAT_WINDOW || '1')
    }
}, { timestamps: true });

// Singleton pattern: Ensure only one document exists
SystemSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            heartbeat_window: parseFloat(process.env.HEARTBEAT_WINDOW || '1')
        });
    }
    return settings;
};

SystemSettingsSchema.statics.updateSettings = async function(data: Partial<ISystemSettingsDocument>) {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            heartbeat_window: data.heartbeat_window || parseFloat(process.env.HEARTBEAT_WINDOW || '1')
        });
    } else {
        Object.assign(settings, data);
        await settings.save();
    }
    return settings;
};

export default mongoose.model<ISystemSettingsDocument, ISystemSettingsModel>('SystemSettings', SystemSettingsSchema);

