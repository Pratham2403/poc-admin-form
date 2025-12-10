import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { AdminLogin } from '../pages/admin/Login';
import { CreateUser } from '../pages/admin/CreateUser';

import { UserLayout } from '../components/layout/UserLayout/UserLayout';
import { AdminLayout } from '../components/layout/AdminLayout/AdminLayout';
import { AuthGuard } from '../components/auth/AuthGuard/AuthGuard';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { CreateForm } from '../pages/admin/CreateForm';
import { EditForm } from '../pages/admin/EditForm';
import { FormsList } from '../pages/user/FormsList';
import { FillForm } from '../pages/user/FillForm';
import { MyResponses } from '../pages/user/MyResponses';
import { EditResponse } from '../pages/user/EditResponse';
import { UserRole } from '@poc-admin-form/shared';

export const AppRoutes = () => {
    return (
        <Routes>
            {/* PUBLIC AUTH ROUTES */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ADMIN PORTAL */}
            <Route element={<AuthGuard roles={[UserRole.ADMIN, UserRole.SUPERADMIN]} />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />

                    {/* Management Routes */}
                    <Route path="/admin/forms" element={<FormsList />} />
                    <Route path="/admin/forms/:id" element={<FillForm />} />
                    <Route path="/admin/my-responses" element={<MyResponses />} />
                    <Route path="/admin/my-responses/:id/edit" element={<EditResponse />} />

                    {/* Admin Actions */}
                    <Route path="/admin/create" element={<CreateForm />} />
                    <Route path="/admin/edit/:id" element={<EditForm />} />

                    {/* Super Admin Actions */}
                    <Route element={<AuthGuard roles={[UserRole.SUPERADMIN]} />}>
                        <Route path="/admin/users/create" element={<CreateUser />} />
                    </Route>

                    {/* Default Admin Redirect */}
                    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
            </Route>

            {/* USER PORTAL */}
            <Route element={<AuthGuard roles={[UserRole.USER]} />}>
                <Route element={<UserLayout />}>
                    <Route path="/forms" element={<FormsList />} />
                    <Route path="/forms/:id" element={<FillForm />} />
                    <Route path="/my-responses" element={<MyResponses />} />
                    <Route path="/my-responses/:id/edit" element={<EditResponse />} />

                    {/* Default User Redirect */}
                    <Route path="/" element={<Navigate to="/forms" replace />} />
                </Route>
            </Route>

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};
