import React, { createContext, useContext, useState, useEffect } from 'react';
import { type IUser } from '@poc-admin-form/shared';
import * as authService from '../services/auth.service';

interface AuthContextType {
    user: IUser | null;
    login: (credentials: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const userStorageKey = import.meta.env.VITE_USER_STORAGE_KEY || 'user';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem(userStorageKey);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials: any) => {
        const data = await authService.login(credentials);
        setUser(data);
        localStorage.setItem(userStorageKey, JSON.stringify(data));
    };

    const register = async (formData: any) => {
        const data = await authService.register(formData);
        setUser(data);
        localStorage.setItem(userStorageKey, JSON.stringify(data));
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        localStorage.removeItem(userStorageKey);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
