import { Request, Response } from 'express';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import { UserRole } from '@poc-admin-form/shared';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({
            email,
            password: hashedPassword,
            name,
            role: UserRole.USER
        });

        // if (user) {
        //     // Generate tokens and set cookies just like login
        //     const accessToken = generateAccessToken(user._id.toString(), user.role);
        //     const refreshToken = generateRefreshToken(user._id.toString());

        //     res.cookie('access_token', accessToken, {
        //         httpOnly: true,
        //         secure: process.env.NODE_ENV === 'production',
        //         sameSite: 'strict',
        //         maxAge: 15 * 60 * 1000 // 15 minutes
        //     });

        //     res.cookie('refresh_token', refreshToken, {
        //         httpOnly: true,
        //         secure: process.env.NODE_ENV === 'production',
        //         sameSite: 'strict',
        //         maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        //     });

        //     res.status(201).json({
        //         _id: user._id,
        //         email: user.email,
        //         name: user.name,
        //         role: user.role
        //     });
        // } else {
        //     res.status(400).json({ message: 'Invalid user data' });
        // }


        return res.status(201).json({
            message: `User ${name} created successfully`,
            success: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            const accessToken = generateAccessToken(user._id.toString(), user.role);
            const refreshToken = generateRefreshToken(user._id.toString());

            res.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


export const logout = (req: Request, res: Response) => {
    res.cookie('access_token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.cookie('refresh_token', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Not authorized, no refresh token' });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken) as any;
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const accessToken = generateAccessToken(user._id.toString(), user.role);

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({
            message: 'Token refreshed',
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, invalid refresh token' });
    }
};

/**
 * Get CSRF token
 */
export const getCSRFToken = (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken });
};

