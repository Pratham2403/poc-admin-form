import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@poc-admin-form/shared';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/poc-admin-form';

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const adminName = process.env.ADMIN_NAME || 'Administrator';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log(`⚠️  Admin user already exists with email: ${adminEmail}`);
            console.log('Updating role to ADMIN...');
            existingAdmin.role = UserRole.ADMIN;
            await existingAdmin.save();
            console.log('✅ Admin role updated');
        } else {
            // Create admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            const admin = await User.create({
                email: adminEmail,
                password: hashedPassword,
                name: adminName,
                role: UserRole.ADMIN,
            });

            console.log('✅ Admin user created successfully!');
            console.log(`   Email: ${admin.email}`);
            console.log(`   Name: ${admin.name}`);
            console.log(`   Role: ${admin.role}`);
        }

        console.log('\n📌 Admin Credentials:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
        console.log('\n🔒 Please change the password after first login!');

    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

seedAdmin();
