import { Routes, Route, Navigate } from "react-router-dom";
import { Login } from "../pages/auth/Login";
import { AdminLogin } from "../pages/admin/Login";
import { CreateUser } from "../pages/admin/CreateUser";
import { EditUser } from "../pages/admin/EditUser";
import { UserManagement } from "../pages/admin/UserManagement";
import { SystemSettings } from "../pages/admin/SystemSettings";
import { Profile } from "../pages/user/Profile";
import { UserLayout } from "../components/layout/UserLayout/UserLayout";
import { AdminLayout } from "../components/layout/AdminLayout/AdminLayout";
import { AuthGuard } from "../components/auth/AuthGuard/AuthGuard";
import { AdminDashboard } from "../pages/admin/Dashboard";
import { CreateForm } from "../pages/admin/CreateForm";
import { EditForm } from "../pages/admin/EditForm";
import { FormsList } from "../pages/user/FormsList";
import { FillForm } from "../pages/user/FillForm";
import { MyResponses } from "../pages/user/MyResponses";
import { EditResponse } from "../pages/user/EditResponse";
import { UserRole } from "@poc-admin-form/shared";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* PUBLIC AUTH ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ADMIN PORTAL */}
      <Route
        element={<AuthGuard roles={[UserRole.ADMIN, UserRole.SUPERADMIN]} />}
      >
        <Route element={<AdminLayout />}>
          {/* Dashboard - accessible to all admins */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Forms viewing - accessible to all admins */}
          <Route path="/admin/forms" element={<FormsList />} />
          <Route path="/admin/forms/:id" element={<FillForm />} />
          <Route path="/admin/my-responses" element={<MyResponses />} />
          <Route
            path="/admin/my-responses/:id/edit"
            element={<EditResponse />}
          />
          <Route
            path="/admin/my-responses/:id/view"
            element={<EditResponse />}
          />

          {/* System Settings - accessible to all admins */}
          <Route path="/admin/system-settings" element={<SystemSettings />} />

          {/**Profile Page for the admins */}
          <Route path="/admin/profile" element={<Profile />} />

          {/* Default Admin Redirect */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Route>
      </Route>

      {/* ADMIN PORTAL - Forms Module Protected Routes */}
      <Route
        element={
          <AuthGuard
            roles={[UserRole.ADMIN, UserRole.SUPERADMIN]}
            requiredModule="forms"
          />
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="/admin/create" element={<CreateForm />} />
          <Route path="/admin/edit/:id" element={<EditForm />} />
        </Route>
      </Route>

      {/* ADMIN PORTAL - Users Module Protected Routes */}
      <Route
        element={
          <AuthGuard
            roles={[UserRole.ADMIN, UserRole.SUPERADMIN]}
            requiredModule="users"
          />
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/users/create" element={<CreateUser />} />
          <Route path="/admin/users/:id" element={<EditUser />} />
        </Route>
      </Route>

      {/* USER PORTAL */}
      <Route element={<AuthGuard roles={[UserRole.USER]} />}>
        <Route element={<UserLayout />}>
          <Route path="/forms" element={<FormsList />} />
          <Route path="/forms/:id" element={<FillForm />} />
          <Route path="/my-responses" element={<MyResponses />} />
          <Route path="/my-responses/:id/edit" element={<EditResponse />} />
          <Route path="/my-responses/:id/view" element={<EditResponse />} />
          <Route path="/profile" element={<Profile />} />

          {/* Default User Redirect */}
          <Route path="/" element={<Navigate to="/forms" replace />} />
        </Route>
      </Route>

      {/* CATCH ALL */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
