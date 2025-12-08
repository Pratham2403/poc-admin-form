import { useTheme } from './theme-provider';
import { Button } from './Button';

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const getIcon = () => {
        if (theme === 'dark' || (theme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            return '🌙';
        }
        return '☀️';
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-9 h-9 p-0"
            title={`Current theme: ${theme}`}
        >
            <span className="text-base">{getIcon()}</span>
        </Button>
    );
}
