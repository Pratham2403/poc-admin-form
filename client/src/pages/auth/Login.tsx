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

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, logout, user } = useAuth(); // Need user from context
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.USER) {
        navigate("/forms", { replace: true });
      } else {
        navigate("/admin/dashboard", { replace: true });
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
      await login({ email, password });

      // Strict Role Check for User Portal
      const storedUser = localStorage.getItem(
        import.meta.env.VITE_USER_STORAGE_KEY || "user"
      );
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.role !== UserRole.USER) {
          await logout();
          throw new Error("Access Denied. Please use the Admin Portal.");
        }
      }

      addToast("Welcome back!", "success");
      navigate("/forms");
    } catch (err: any) {
      if (err.message.includes("Access Denied")) {
        addToast(err.message, "error");
      } else {
        addToast(err.response?.data?.message || "Failed to login", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FormSuite
          </h1>
          <p className="text-muted-foreground mt-2">Form Management System</p>
        </div>

        <Card className="shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                    className="pr-10"
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
