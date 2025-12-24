import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { UserRole, UserMode } from "@poc-admin-form/shared";
import { getUserById, updateUser } from "../../services/user.service";
import { UserCog } from "lucide-react";
import { UserForm } from "../../components/forms/UserForm/UserForm";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "../../contexts/AuthContext";

interface UpdateUserData {
  name: string;
  email: string;
  role?: UserRole;
  employeeId?: string;
  vendorId?: string;
  modulePermissions?: { users: boolean; forms: boolean };
  password?: string;
}

interface UserData extends UpdateUserData {
  _id: string;
}

export const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const { addToast } = useToast();

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) {
        addToast("Invalid user ID", "error");
        navigate("/admin/users");
        return;
      }

      try {
        setFetchingUser(true);
        const response = await getUserById(id);
        setUserData(response);

        // Determine if edit should be read-only
        // RULE 1: SuperAdmin cannot edit another SuperAdmin
        if (
          currentUser?.role === UserRole.SUPERADMIN &&
          response.role === UserRole.SUPERADMIN
        ) {
          setIsReadOnly(true);
        }
        // RULE 2: Admin cannot edit Admin or SuperAdmin
        else if (currentUser?.role === UserRole.ADMIN) {
          if (
            response.role === UserRole.ADMIN ||
            response.role === UserRole.SUPERADMIN
          ) {
            setIsReadOnly(true);
          }
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        addToast(
          error.response?.data?.message || "Failed to fetch user details",
          "error"
        );
        navigate("/admin/users");
      } finally {
        setFetchingUser(false);
      }
    };

    fetchUser();
  }, [id, addToast, navigate, currentUser]);

  const handleUpdateUser = async (updatedData: UpdateUserData) => {
    if (!id) return;

    setLoading(true);
    try {
      await updateUser(id, updatedData);
      addToast(`User ${updatedData.name} updated successfully`, "success");
      navigate("/admin/users");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      addToast(
        error.response?.data?.message || "Failed to update user",
        "error"
      );
      throw err; // Re-throw to prevent navigation on error
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <div className="w-full max-w-4xl animate-in fade-in duration-500">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="w-full max-w-4xl animate-in fade-in duration-500">
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          Edit User
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Update user information and permissions.
        </p>
      </div>

      {/* User Form Component */}
      <UserForm
        mode={UserMode.EDIT}
        initialData={userData}
        onSubmit={handleUpdateUser}
        loading={loading}
        readOnly={isReadOnly}
      />
    </div>
  );
};
