
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';

import { MainLayout } from '../components/layout/MainLayout/MainLayout';
import { AuthGuard } from '../components/auth/AuthGuard/AuthGuard';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { CreateForm } from '../pages/admin/CreateForm';
import { EditForm } from '../pages/admin/EditForm';
import { FormsList } from '../pages/user/FormsList';
import { FillForm } from '../pages/user/FillForm';
import { MyResponses } from '../pages/user/MyResponses';
import { EditResponse } from '../pages/user/EditResponse';
import { UserRole } from '@poc-admin-form/shared';

const userStorageKey = import.meta.env.VITE_USER_STORAGE_KEY || 'user';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<AuthGuard />}>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/forms" element={<FormsList />} />
                    <Route path="/forms/:id" element={<FillForm />} />
                    <Route path="/my-responses" element={<MyResponses />} />
                    <Route path="/my-responses/:id/edit" element={<EditResponse />} />

                    <Route element={<AuthGuard roles={[UserRole.ADMIN]} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/create" element={<CreateForm />} />
                        <Route path="/admin/edit/:id" element={<EditForm />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const HomeRedirect = () => {
    // We need to access the user role here.
    // Since this is inside AuthGuard, user should be logged in, but let's be safe.
    // We can't use useAuth hook directly inside the component definition if we define it here unless we import it.
    // But we can.
    const userStr = localStorage.getItem(userStorageKey);
    if (!userStr) return <Navigate to="/login" replace />;

    try {
        const user = JSON.parse(userStr);
        if (user.role === UserRole.ADMIN) {
            return <Navigate to="/admin/dashboard" replace />;
        } else {
            return <Navigate to="/forms" replace />;
        }
    } catch (error) {
        return <Navigate to="/login" replace />;
    }
};
