import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme } from "@poc-admin-form/shared";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: Theme.LIGHT,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = Theme.LIGHT,
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const getPreferredTheme = () => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme === Theme.LIGHT || storedTheme === Theme.DARK)
      return storedTheme;

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) return Theme.DARK;

    const prefersLight = window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;
    if (prefersLight) return Theme.LIGHT;

    return defaultTheme || Theme.LIGHT;
  };

  const [theme, setTheme] = useState<Theme>(getPreferredTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove(Theme.LIGHT, Theme.DARK);
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
