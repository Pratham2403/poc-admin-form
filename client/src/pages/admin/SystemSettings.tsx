import { useState, useEffect } from 'react';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { getSettings, updateSettings } from '../../services/systemSettings.service';
import {
  Settings,
  Clock,
  Save,
  CheckCircle2
} from 'lucide-react';

export const SystemSettings = () => {
  const [heartbeatWindow, setHeartbeatWindow] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setInitialLoading(true);
        const settings = await getSettings();
        setHeartbeatWindow(settings.heartbeat_window);
      } catch (err: any) {
        addToast('Failed to load settings', 'error');
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (heartbeatWindow <= 0) {
      addToast('Heartbeat window must be a positive number', 'warning');
      return;
    }

    setLoading(true);
    try {
      await updateSettings({ heartbeat_window: heartbeatWindow });
      addToast('Settings updated successfully', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Spinner />;
  }

  return (
    <div className="w-full max-w-4xl animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Configure system-wide settings
        </p>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xl">Application Settings</CardTitle>
          <CardDescription>
            Manage system configuration and behavior
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="heartbeatWindow" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Heartbeat Window (hours)
              </Label>
              <Input
                id="heartbeatWindow"
                type="number"
                min="0.1"
                step="0.1"
                value={heartbeatWindow}
                onChange={(e) => setHeartbeatWindow(parseFloat(e.target.value) || 1)}
                placeholder="1"
                className="bg-background/50"
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Time window (in hours) to determine if a user is considered "online". 
                Users who have visited within this window will be marked as active.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border/40 bg-muted/20 py-4 gap-3">
            <Button type="submit" disabled={loading} className="min-w-[140px] shadow-lg hover:shadow-xl transition-all">
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

