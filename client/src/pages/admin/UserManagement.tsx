import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "../../services/user.service";
import { getSettings } from "../../services/systemSettings.service";
import { type IUser, UserRole } from "@poc-admin-form/shared";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import { SearchFilterBar } from "../../components/ui/SearchFilterBar";
import { Pagination } from "../../components/ui/Pagination";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  Plus,
  Mail,
  User,
  Shield,
  MapPin,
  Building,
  Hash,
  Circle,
} from "lucide-react";

/**
 * Format last active status based on heartbeat window
 * @param lastHeartbeat - The last heartbeat timestamp
 * @param heartbeatWindowHours - The heartbeat window in hours (default: 1)
 * @returns Object with status text and whether user is online
 */
const formatLastActive = (
  lastHeartbeat?: Date | string,
  heartbeatWindowHours: number = 1
): { text: string; isOnline: boolean } => {
  if (!lastHeartbeat) return { text: "Never", isOnline: false };

  const date =
    typeof lastHeartbeat === "string" ? new Date(lastHeartbeat) : lastHeartbeat;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const windowMs = heartbeatWindowHours * 60 * 60 * 1000;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // User is online if within heartbeat window
  const isOnline = diffMs < windowMs;

  if (diffMins < 1) return { text: "Just now", isOnline };
  if (diffMins < 60)
    return { text: `${diffMins} min${diffMins > 1 ? "s" : ""} ago`, isOnline };
  if (diffHours < 24)
    return {
      text: `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`,
      isOnline,
    };
  if (diffDays < 7)
    return { text: `${diffDays} day${diffDays > 1 ? "s" : ""} ago`, isOnline };

  return { text: date.toLocaleDateString(), isOnline: false };
};

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [heartbeatWindow, setHeartbeatWindow] = useState(1); // Default 1 hour

  const { addToast } = useToast();

  // Fetch heartbeat window from system settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings();
        setHeartbeatWindow(settings.heartbeat_window);
      } catch {
        // Fallback to default 1 hour if settings can't be loaded
        setHeartbeatWindow(1);
      }
    };
    loadSettings();
  }, []);

  const loadUsers = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true);
        const response = await getUsers(page, 10, search);
        setUsers(response.data);
        setTotalPages(response.pagination.pages);
        setTotalUsers(response.pagination.total);
        setCurrentPage(response.pagination.page);
      } catch {
        addToast("Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadUsers(currentPage, searchQuery);
  }, [currentPage, loadUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadUsers(1, searchQuery);
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadUsers]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const canCreateUser =
    currentUser?.role === UserRole.SUPERADMIN ||
    (currentUser?.role === UserRole.ADMIN &&
      currentUser?.modulePermissions?.users);

  if (loading && users.length === 0) return <PageLoader />;

  return (
    <div className="flex flex-col min-h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users and their access permissions
          </p>
        </div>
        {canCreateUser && (
          <Link to="/admin/users/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          </Link>
        )}
      </div>

      <SearchFilterBar
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search users by name, email, employee ID, or vendor ID..."
      />

      {users.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "Get started by creating a new user"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    IDs
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || "No name"}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === UserRole.SUPERADMIN
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : user.role === UserRole.ADMIN
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role === UserRole.SUPERADMIN
                          ? "Super Admin"
                          : user.role === UserRole.ADMIN
                          ? "Admin"
                          : "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {user.address || user.city ? (
                          <div className="flex flex-col gap-1">
                            {user.address && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {user.address}
                              </div>
                            )}
                            {user.city && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-muted-foreground" />
                                {user.city}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        {user.employeeId && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Emp:</span>
                            <span>{user.employeeId}</span>
                          </div>
                        )}
                        {user.vendorId && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Vend:</span>
                            <span>{user.vendorId}</span>
                          </div>
                        )}
                        {!user.employeeId && !user.vendorId && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const { text, isOnline } = formatLastActive(
                          user.lastHeartbeat,
                          heartbeatWindow
                        );
                        return (
                          <div className="flex items-center gap-2 text-sm">
                            <Circle
                              className={`h-3 w-3 ${
                                isOnline
                                  ? "fill-green-500 text-green-500"
                                  : "fill-gray-400 text-gray-400"
                              }`}
                            />
                            <span
                              className={
                                isOnline
                                  ? "text-green-600 dark:text-green-400 font-medium"
                                  : ""
                              }
                            >
                              {isOnline ? "Online" : text}
                            </span>
                            {isOnline && text !== "Just now" && (
                              <span className="text-muted-foreground">
                                ({text})
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/users/${user._id}`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        disabled={loading}
        totalItems={totalUsers}
        itemsPerPage={3}
      />
    </div>
  );
};
