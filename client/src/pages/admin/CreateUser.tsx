import { useState } from "react";
import { useToast } from "../../components/ui/Toast";
import { UserRole, UserMode } from "@poc-admin-form/shared";
import { createUser } from "../../services/user.service";
import { UserPlus } from "lucide-react";
import { UserForm } from "../../components/forms/UserForm/UserForm";
import { usePortalPath } from "@/hooks/usePortalPath";
import { useNavigate } from "react-router";

interface CreateUserData {
  name: string;
  email: string;
  role?: UserRole;
  employeeId?: string;
  vendorId?: string;
  modulePermissions?: { users: boolean; forms: boolean };
  password?: string;
}

export const CreateUser = () => {
  const navigate = useNavigate();
  const { getPath } = usePortalPath();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleCreateUser = async (userData: CreateUserData) => {
    setLoading(true);
    try {
      await createUser(userData);
      addToast(`User ${userData.name} created successfully`, "success");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      addToast(
        error.response?.data?.message || "Failed to create user",
        "error"
      );
      throw err; // Re-throw to prevent form reset on error
    } finally {
      setLoading(false);
      navigate(getPath("/admin/users"));
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          Create User
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Add a new user to the system.
        </p>
      </div>

      {/* User Form Component */}
      <UserForm
        mode={UserMode.CREATE}
        onSubmit={handleCreateUser}
        loading={loading}
      />
    </div>
  );
};
