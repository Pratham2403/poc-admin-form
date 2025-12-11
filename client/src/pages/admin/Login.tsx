import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/Toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
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
import { Eye, EyeOff } from "lucide-react";

export const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        // If a regular user tries to visit admin login, they are technically logged in.
        // We could redirect them to their home, or logout.
        // Redirecting to home is smoother.
        navigate("/forms", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      addToast("Please fill in all fields", "warning");
      return;
    }

    setLoading(true);
    try {
      // We can't verify role BEFORE login call effectively without an endpoint that tells us,
      // so we login, then check. Ideally backend should have separate endpoints but we are strictly frontend enforcing.
      await login({ email, password });

      // Note: The AuthContext update might be async/batched, but since we await the service call,
      // we might need to check the return value of login if possible, or trust the updated state in a simpler flow.
      // However, useAuth's login typically returns void. We might need to handle this carefully.
      // The safest is to rely on AuthGuard or check the stored user immediately if login returns it.
      // But let's assume standard flow where we can check user role after await if context updates.
      // If context doesn't update immediately in this closure, we might need a workaround.
      // BETTER APPROACH: Redirect to dashboard. AuthGuard there will kick them back if they are not admin.
      // BUT to give better UX (error message), let's try to check local storage.

      const storedUser = localStorage.getItem(
        import.meta.env.VITE_USER_STORAGE_KEY || "user"
      );
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (
          userData.role !== UserRole.ADMIN &&
          userData.role !== UserRole.SUPERADMIN
        ) {
          await logout();
          throw new Error("Access Denied. Admins only.");
        }
      }

      addToast("Welcome Administrator", "success");
      navigate("/admin/dashboard");
    } catch (err: any) {
      // Ensure we are logged out if role check failed
      if (err.message.includes("Admins only")) {
        addToast(err.message, "error");
      } else {
        addToast(err.response?.data?.message || "Failed to login", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-slate-400 mt-2">Restricted Access Area</p>
        </div>

        <Card className="shadow-2xl border-t-4 border-t-red-500 bg-slate-900 border-slate-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-slate-100">
              Admin Login
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your administrative credentials
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  disabled={loading}
                  autoComplete="email"
                  className="bg-slate-950 border-slate-700 text-slate-100 focus:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                    className="bg-slate-950 border-slate-700 text-slate-100 focus:ring-red-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Access Dashboard"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
