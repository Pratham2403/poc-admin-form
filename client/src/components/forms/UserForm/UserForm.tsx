import { useState, useEffect } from "react";
import { useToast } from "../../ui/Toast";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Label } from "../../ui/Label";
import { Select } from "../../ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../ui/Card";
import { Spinner } from "../../ui/Spinner";
import { UserRole, UserMode } from "@poc-admin-form/shared";
import { useAuth } from "../../../contexts/AuthContext";
import {
  Mail,
  User,
  Shield,
  Key,
  CheckCircle2,
  Hash,
  Info,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

interface UserFormData {
  name: string;
  email: string;
  role?: UserRole;
  employeeId?: string;
  vendorId?: string;
  modulePermissions?: { users: boolean; forms: boolean };
  password?: string;
}

interface UserFormProps {
  mode: UserMode;
  initialData?: UserFormData;
  onSubmit: (data: UserFormData) => Promise<void>;
  loading?: boolean;
  readOnly?: boolean;
}

export const UserForm = ({
  mode,
  initialData,
  onSubmit,
  loading: externalLoading = false,
  readOnly = false,
}: UserFormProps) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN;
  const isAdmin = user?.role === UserRole.ADMIN;
  const hasUsersModule = user?.modulePermissions?.users;

  // Determine if user can edit employeeId/vendorId
  const canEditEmployeeVendorId = isSuperAdmin || (isAdmin && hasUsersModule);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [employeeId, setEmployeeId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [password, setPassword] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [useDefaultPassword, setUseDefaultPassword] = useState(true);
  const [showPassword, setShowPassword] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>("forms");

  const { addToast } = useToast();

  // Initialize form with data for edit mode
  useEffect(() => {
    if (mode === UserMode.EDIT && initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setRole(initialData.role || UserRole.USER);
      setEmployeeId(initialData.employeeId || "");
      setVendorId(initialData.vendorId || "");

      // Set module permissions
      if (initialData.modulePermissions) {
        const { users, forms } = initialData.modulePermissions;
        if (users && forms) {
          setSelectedModule("all");
        } else if (users) {
          setSelectedModule("users");
        } else if (forms) {
          setSelectedModule("forms");
        }
      }
    }
  }, [mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (readOnly) {
      addToast("You do not have permission to edit this user", "error");
      return;
    }

    if (!name || !email) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    const userData: UserFormData = {
      name,
      email,
      role: isSuperAdmin ? role : UserRole.USER,
    };

    // SuperAdmin and Admin (with users module) can set employeeId/vendorId
    if (canEditEmployeeVendorId) {
      // For Admin: only allow if editing User role
      if (isAdmin && initialData?.role !== UserRole.USER) {
        // Skip employeeId/vendorId if Admin is editing non-User
      } else {
        if (employeeId) userData.employeeId = employeeId;
        if (vendorId) userData.vendorId = vendorId;
      }
    }

    // Only SuperAdmin can set role and modulePermissions
    if (isSuperAdmin) {
      // Set module permissions if role is ADMIN and module is selected
      if (role === UserRole.ADMIN && selectedModule) {
        if (selectedModule === "all") {
          userData.modulePermissions = {
            users: true,
            forms: true,
          };
        } else {
          userData.modulePermissions = {
            users: selectedModule === "users",
            forms: selectedModule === "forms",
          };
        }
      }
    }

    // Password handling
    if (mode === UserMode.CREATE) {
      // For create mode: use default or custom password
      if (!useDefaultPassword && password) {
        userData.password = password;
      }
    } else if (mode === UserMode.EDIT) {
      // For edit mode: only include password if changing
      if (changePassword && password) {
        userData.password = password;
      }
    }

    await onSubmit(userData);
  };

  const handleReset = () => {
    if (mode === UserMode.CREATE) {
      setName("");
      setEmail("");
      setRole(UserRole.USER);
      setEmployeeId("");
      setVendorId("");
      setPassword("");
      setUseDefaultPassword(true);
      setSelectedModule("forms");
    } else if (initialData) {
      // Reset to initial data
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setRole(initialData.role || UserRole.USER);
      setEmployeeId(initialData.employeeId || "");
      setVendorId(initialData.vendorId || "");
      setPassword("");
      setChangePassword(false);

      if (initialData.modulePermissions) {
        if (initialData.modulePermissions.users) {
          setSelectedModule("users");
        } else if (initialData.modulePermissions.forms) {
          setSelectedModule("forms");
        }
      }
    }
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-xl">User Details</CardTitle>
        <CardDescription>
          {mode === UserMode.CREATE
            ? "Basic information and role assignment"
            : "Update user information and role assignment"}
        </CardDescription>
      </CardHeader>

      {/* Read-only warning message */}
      {readOnly && (
        <div className="mx-6 mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
              View Only Mode
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              You do not have permission to edit this user.{" "}
              {isSuperAdmin
                ? "SuperAdmin cannot edit another SuperAdmin."
                : "Admin cannot edit other Admins or SuperAdmins."}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          <div
            className={`grid grid-cols-1 gap-6 ${
              isSuperAdmin ? "md:grid-cols-5" : ""
            }`}
          >
            <div
              className={`space-y-2 ${
                isSuperAdmin
                  ? role === UserRole.ADMIN
                    ? "md:col-span-3"
                    : "md:col-span-4"
                  : ""
              }`}
            >
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Full Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="bg-background/50"
                disabled={externalLoading || readOnly}
                required
              />
            </div>

            {isSuperAdmin && (
              <>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Role
                  </Label>
                  <Select
                    id="role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as UserRole);
                      if (e.target.value !== UserRole.ADMIN) {
                        setSelectedModule("");
                      }
                    }}
                    disabled={externalLoading || readOnly}
                    className="bg-background/50"
                  >
                    <option value={UserRole.USER}>User</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </Select>
                </div>
                {role === UserRole.ADMIN && (
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="module" className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Module
                      <div className="group relative">
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-56 p-2 bg-popover border rounded-md shadow-lg text-xs">
                          <p className="font-semibold mb-1">All Modules:</p>
                          <p className="text-muted-foreground mb-2">
                            Access to both users and forms management
                          </p>
                          <p className="font-semibold mb-1">Users Module:</p>
                          <p className="text-muted-foreground mb-2">
                            Access to user management features
                          </p>
                          <p className="font-semibold mb-1">Forms Module:</p>
                          <p className="text-muted-foreground">
                            Access to form creation and management
                          </p>
                        </div>
                      </div>
                    </Label>
                    <Select
                      id="module"
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      disabled={externalLoading || readOnly}
                      className="bg-background/50"
                    >
                      <option
                        value="all"
                        title="Access to both users and forms management"
                      >
                        All
                      </option>
                      <option
                        value="forms"
                        title="Access to form creation and management"
                      >
                        Forms
                      </option>
                      <option
                        value="users"
                        title="Access to user management features"
                      >
                        Users
                      </option>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="bg-background/50"
              disabled={externalLoading || readOnly}
              required
            />
          </div>

          {/* EmployeeId and VendorId - visible to both SuperAdmin and Admin with users module */}
          {canEditEmployeeVendorId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP001"
                  className="bg-background/50"
                  disabled={externalLoading || readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorId" className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  Vendor ID
                </Label>
                <Input
                  id="vendorId"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  placeholder="e.g. VEND001"
                  className="bg-background/50"
                  disabled={externalLoading || readOnly}
                />
              </div>
            </div>
          )}

          {/* Password Section */}
          <div className="space-y-4">
            {mode === UserMode.CREATE ? (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useDefaultPassword"
                    checked={useDefaultPassword}
                    onChange={(e) => setUseDefaultPassword(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={externalLoading || readOnly}
                  />
                  <Label
                    htmlFor="useDefaultPassword"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="h-4 w-4 text-muted-foreground" />
                    Use default password (password123)
                  </Label>
                </div>

                {!useDefaultPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Custom Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter custom password"
                        className="bg-background/50 pr-10"
                        disabled={externalLoading || readOnly}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="changePassword"
                    checked={changePassword}
                    onChange={(e) => setChangePassword(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={externalLoading || readOnly}
                  />
                  <Label
                    htmlFor="changePassword"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="h-4 w-4 text-muted-foreground" />
                    Change Password
                  </Label>
                </div>

                {changePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="bg-background/50 pr-10"
                        disabled={externalLoading || readOnly}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-border/40 bg-muted/20 py-4 gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={externalLoading || readOnly}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={externalLoading || readOnly}
            className="min-w-[140px] shadow-lg hover:shadow-xl transition-all"
          >
            {externalLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {mode === UserMode.CREATE ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {mode === UserMode.CREATE ? "Create User" : "Update User"}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
