import { useState } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { UserRole } from '@poc-admin-form/shared';

export const CreateUser = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.USER);
    // Password hardcoded as per instructions
    const password = 'password123';

    const [loading, setLoading] = useState(false);
    // const { register } = useAuth(); // Assuming authService.register handles generic registration for now
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email) {
            addToast('Please fill in all fields', 'warning');
            return;
        }

        setLoading(true);
        try {
            // Dynamically import authService to call register directly.
            // This prevents the AuthContext from automatically updating the current session 
            // to the newly created user, allowing the Super Admin to stay logged in.
            await import('../../services/auth.service').then(async (service) => {
                await service.register({ name, email, password, role });
            });

            addToast(`User ${name} (${role}) created successfully with password: ${password}`, 'success');
            // Navigate back to dashboard or users list
            navigate('/admin/dashboard');

        } catch (err: any) {
            addToast(err.response?.data?.message || 'Failed to create user', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Register New User</CardTitle>
                    <CardDescription>
                        Create a new user account. Default password will be <strong>{password}</strong>.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="John Doe"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    disabled={loading}
                                >
                                    <option value={UserRole.USER}>User</option>
                                    <option value={UserRole.ADMIN}>Admin</option>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                disabled={loading}
                            />
                        </div>
                        <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground">
                            <p>⚠️ The user will need to change their password after first login (if implemented).</p>
                            <p>Current Default Password: <code className="bg-background px-1 rounded border">{password}</code></p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Creating User...
                                </>
                            ) : (
                                'Create User'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
