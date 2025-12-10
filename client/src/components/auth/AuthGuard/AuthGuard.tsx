import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '@poc-admin-form/shared';
import { Loader } from '../../ui/Loader';
interface AuthGuardProps {
    roles?: UserRole[];
}

export const AuthGuard = ({ roles }: AuthGuardProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // You might want a spinner here
        return <Loader />;
    }

    if (!user) {
        // Redirect to appropriate login based on attempted path
        if (location.pathname.startsWith('/admin')) {
            return <Navigate to="/admin/login" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // STRICT SEPARATION LOGIC
    const isAdminPath = location.pathname.startsWith('/admin');
    const isAdminUser = user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN;

    if (isAdminPath && !isAdminUser) {
        // User trying to access Admin pages -> Kick to User land
        return <Navigate to="/forms" replace />;
    }

    if (!isAdminPath && isAdminUser) {
        // Admin trying to access User pages -> Kick to Admin land
        // Note: Unless it's a shared public page, but here we want strict separation
        return <Navigate to="/admin/dashboard" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

