import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../ui/Toast';
import { Button } from '../../ui/Button';
import { ModeToggle } from '../../ui/mode-toggle';

export const UserLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            addToast('Logged out successfully', 'success');
            navigate('/login');
        } catch (error) {
            addToast('Failed to logout', 'error');
        }
    };

    const isActive = (path: string) => location.pathname.startsWith(path);

    const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
        <Link
            to={to}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive(to)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
        >
            {children}
        </Link>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-9 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
                            FS
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            FormSuite
                        </span>
                    </Link>

                    {/* Navigation - Desktop */}
                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink to="/forms">Forms</NavLink>
                        <NavLink to="/my-responses">My Responses</NavLink>
                    </nav>

                    {/* User Info & Actions - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                        <ModeToggle />

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium">{user?.name || user?.email}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                                {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center gap-4 md:hidden">
                        <ModeToggle />
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <span className="text-2xl">✕</span>
                            ) : (
                                <span className="text-2xl">☰</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t bg-background absolute left-0 right-0 h-[calc(100vh-4rem)] p-4 space-y-4 animate-in slide-in-from-top-5">
                        <div className="flex items-center gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-lg">
                                {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium">{user?.name || user?.email}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-2">
                            <Link
                                to="/forms"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`p-4 rounded-lg border hover:bg-accent transition-colors ${isActive('/forms') ? 'border-primary bg-primary/5' : ''}`}
                            >
                                Forms
                            </Link>
                            <Link
                                to="/my-responses"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`p-4 rounded-lg border hover:bg-accent transition-colors ${isActive('/my-responses') ? 'border-primary bg-primary/5' : ''}`}
                            >
                                My Responses
                            </Link>
                        </nav>

                        <div className="pt-4 border-t">
                            <Button variant="destructive" className="w-full" onClick={handleLogout}>
                                Logout
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t bg-muted/30 mt-auto">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} FormSuite. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};
