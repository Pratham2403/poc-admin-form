import { useLocation } from 'react-router-dom';
import { UserRole } from '@poc-admin-form/shared';
import { useAuth } from '../contexts/AuthContext';

export const usePortalPath = () => {
    const location = useLocation();
    const { user } = useAuth();
    const isAdmin = location.pathname.startsWith('/admin');

    // Helper to generate paths relative to the current portal
    const getPath = (path: string) => {
        // Remove leading slash to append correctly
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;

        if (isAdmin) {
            return `/admin/${cleanPath}`;
        }
        return `/${cleanPath}`;
    };

    return {
        isAdmin,
        getPath,
        role: user?.role || (isAdmin ? UserRole.ADMIN : UserRole.USER)
    };
};
