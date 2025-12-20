import { useState } from "react";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../components/ui/Card";
import { Spinner } from "../../components/ui/Spinner";
import { UserRole } from "@poc-admin-form/shared";
import { createUser } from "../../services/user.service";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserPlus,
  Mail,
  User,
  Shield,
  Key,
  CheckCircle2,
  Hash,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";


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
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [employeeId, setEmployeeId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [password, setPassword] = useState("");
  const [useDefaultPassword, setUseDefaultPassword] = useState(true);
  const [showPassword, setShowPassword] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>("forms");

  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    setLoading(true);
    try {

      const userData: CreateUserData = {
        name,
        email,
        role: isSuperAdmin ? role : UserRole.USER,
      };

      // Only super admin can set these fields
      if (isSuperAdmin) {
        if (employeeId) userData.employeeId = employeeId;
        if (vendorId) userData.vendorId = vendorId;
        // Set module permissions if role is ADMIN and module is selected
        if (role === UserRole.ADMIN && selectedModule) {
          userData.modulePermissions = {
            users: selectedModule === "users",
            forms: selectedModule === "forms",
          };
        }
      }

      // Password handling
      if (!useDefaultPassword && password) {
        userData.password = password;
      }

      await createUser(userData);

      addToast(`User ${name} created successfully`, "success");

      // Reset form
      setName("");
      setEmail("");
      setRole(UserRole.USER);
      setEmployeeId("");
      setVendorId("");
      setPassword("");
      setUseDefaultPassword(true);
      setSelectedModule("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      addToast(
        error.response?.data?.message || "Failed to create user",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          Create User
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Add a new user to the system.
        </p>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xl">User Details</CardTitle>
          <CardDescription>
            Basic information and role assignment
          </CardDescription>
        </CardHeader>
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
                  disabled={loading}
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
                      disabled={loading}
                      className="bg-background/50"
                    >
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </Select>
                  </div>
                  {role === UserRole.ADMIN && (
                    <div className="space-y-2 md:col-span-1">
                      <Label
                        htmlFor="module"
                        className="flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Module
                        <div className="group relative">
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-48 p-2 bg-popover border rounded-md shadow-lg text-xs">
                            <p className="font-semibold mb-1">Users Module:</p>
                            <p className="text-muted-foreground">
                              Access to user management features
                            </p>
                            <p className="font-semibold mb-1 mt-2">
                              Forms Module:
                            </p>
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
                        disabled={loading}
                        className="bg-background/50"
                      >
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
                disabled={loading}
                required
              />
            </div>

            {isSuperAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="employeeId"
                    className="flex items-center gap-2"
                  >
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    Employee ID
                  </Label>
                  <Input
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP001"
                    className="bg-background/50"
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useDefaultPassword"
                  checked={useDefaultPassword}
                  onChange={(e) => setUseDefaultPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={loading}
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
                      disabled={loading}
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
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/40 bg-muted/20 py-4 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName("");
                setEmail("");
                setRole(UserRole.USER);
                setEmployeeId("");
                setVendorId("");
                setPassword("");
                setUseDefaultPassword(true);
                setSelectedModule("");
              }}
              disabled={loading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[140px] shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
