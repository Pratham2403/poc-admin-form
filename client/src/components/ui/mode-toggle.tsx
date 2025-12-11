import { Theme } from "@poc-admin-form/shared";
import { Moon, Sun } from "lucide-react";
import { Button } from "./Button";
import { useTheme } from "./theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === Theme.DARK;

  const toggleTheme = () => {
    setTheme(isDark ? Theme.LIGHT : Theme.DARK);
  };

  const getIcon = () => {
    const shared = "h-4 w-4 transition-colors duration-150";
    return isDark ? (
      <Moon className={`${shared} text-slate-400`} />
    ) : (
      <Sun className={`${shared} text-amber-500`} />
    );
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 rounded-full border border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      title={`Current theme: ${theme}`}
    >
      {getIcon()}
    </Button>
  );
}
