import { useState, useEffect } from "react";
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
import { useAuth } from "../../contexts/AuthContext";
import { updateUserProfile, getUserById } from "../../services/user.service";
import {
  User,
  Mail,
  MapPin,
  Building,
  Hash,
  CheckCircle2,
} from "lucide-react";

export const Profile = () => {
  const { user: currentUser } = useAuth();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { addToast } = useToast();
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?._id) return;

      try {
        setInitialLoading(true);
        const userData = await getUserById(currentUser._id);
        setAddress(userData.address || "");
        setCity(userData.city || "");
      } catch (err: any) {
        addToast("Failed to load profile", "error");
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?._id, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser?._id) return;

    setLoading(true);
    try {
      await updateUserProfile({ address, city });
      addToast("Profile updated successfully", "success");
    } catch (err: any) {
      addToast(
        err.response?.data?.message || "Failed to update profile",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Spinner />;
  }

  return (
    <div className="w-full animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your profile information
        </p>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xl">Profile Information</CardTitle>
          <CardDescription>
            Update your address and city information
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={currentUser?.name || ""}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Name cannot be changed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 101, Tower A, Sector 62"
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  City
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Noida"
                  className="bg-background/50"
                  disabled={loading}
                />
              </div>
            </div>

            {(currentUser?.employeeId || currentUser?.vendorId) && (
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Read-Only Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentUser?.employeeId && (
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
                        value={currentUser.employeeId}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Managed by administrator
                      </p>
                    </div>
                  )}

                  {currentUser?.vendorId && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="vendorId"
                        className="flex items-center gap-2"
                      >
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        Vendor ID
                      </Label>
                      <Input
                        id="vendorId"
                        value={currentUser.vendorId}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Managed by administrator
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border/40 bg-muted/20 py-4 gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[140px] shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
