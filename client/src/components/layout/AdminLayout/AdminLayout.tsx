import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../ui/Toast';
import { Button } from '../../ui/Button';
import { ModeToggle } from '../../ui/mode-toggle';
import { UserRole } from '@poc-admin-form/shared';

export const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            addToast('Logged out successfully', 'success');
            navigate('/admin/login');
        } catch (error) {
            addToast('Failed to logout', 'error');
        }
    };

    const isActive = (path: string) => {
        if (path === '/admin/users/create') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path) && location.pathname !== '/admin/users/create';
    };

    const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
        <Link
            to={to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(to)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
        >
            {children}
        </Link>
    );

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
                    FS
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    FormSuite
                </span>
                <div className="ml-auto hidden md:block">
                    <ModeToggle />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-2">
                    <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Overview
                    </div>
                    <NavLink to="/admin/dashboard">Dashboard</NavLink>

                    <div className="px-3 mt-6 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Management
                    </div>
                    <NavLink to="/admin/forms">Forms</NavLink>
                    {(user?.role === UserRole.SUPERADMIN || user?.modulePermissions?.forms) && (
                        <NavLink to="/admin/create">Create Form</NavLink>
                    )}
                    <NavLink to="/admin/my-responses">My Responses</NavLink>
                    {(user?.role === UserRole.SUPERADMIN || user?.modulePermissions?.users) && (
                        <NavLink to="/admin/users">User Management</NavLink>
                    )}
                    {(user?.role === UserRole.SUPERADMIN || user?.modulePermissions?.users) && (
                        <NavLink to="/admin/users/create">Create User</NavLink>
                    )}
                    <NavLink to="/admin/system-settings">System Settings</NavLink>
                </nav>
            </div>

            <div className="p-4 border-t bg-muted/5">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full bg-background flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r bg-muted/10 hidden md:flex flex-col flex-none">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <aside className="relative w-64 h-full border-r bg-background flex flex-col animate-in slide-in-from-left">
                        <SidebarContent />
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground md:hidden"
                        >
                            ✕
                        </button>
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                <header className="h-16 border-b flex items-center justify-between px-6 md:hidden flex-none bg-background/95 backdrop-blur z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
                            aria-label="Toggle menu"
                        >
                            <span className="text-2xl">☰</span>
                        </button>
                        <span className="font-bold text-lg">Admin Portal</span>
                    </div>
                    <ModeToggle />
                </header>

                <main className="flex-1 p-6 overflow-y-auto scroll-smooth">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
