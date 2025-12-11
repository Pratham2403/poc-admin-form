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
import { register } from "../../services/auth.service";
import {
  UserPlus,
  Mail,
  User,
  Shield,
  Key,
  CheckCircle2
} from "lucide-react";

export const CreateUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const password = "password123";

  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      addToast("Please fill in all fields", "warning");
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password, role });

      addToast(
        `User ${name} created successfully`,
        "success"
      );
      setName("");
      setEmail("");
      setRole(UserRole.USER);
    } catch (err: any) {
      addToast(err.response?.data?.message || "Failed to create user", "error");
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

            <div className="grid grid-cols-1 md:grid-cols-[4fr_1fr] gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Role
                </Label>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={loading}
                  className="bg-background/50"
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="bg-background/50"
                disabled={loading}
              />
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-3 rounded-md flex items-center gap-3">
              <Key className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="text-sm flex-1 flex flex-wrap items-center gap-x-2">
                <span className="text-blue-700 dark:text-blue-300">Default Password:</span>
                <code className="bg-background/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 text-foreground font-mono font-bold text-xs">
                  {password}
                </code>
                <span className="text-xs text-muted-foreground">(User cannot change this initially)</span>
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-between border-t border-border/40 bg-muted/20 py-4 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setName("");
                setEmail("");
                setRole(UserRole.USER)
              }}
              disabled={loading}
            >
              Reset
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[140px] shadow-lg hover:shadow-xl transition-all">
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
