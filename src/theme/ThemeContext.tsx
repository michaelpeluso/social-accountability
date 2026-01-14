/**
 * Theme Context and Provider
 * Allows dynamic theme switching at runtime
 * Defaults to system preference (light/dark mode)
 */

import { createContext, useContext, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";
import { theme as lightTheme, Theme } from "./tokens.light";
import { theme as darkTheme } from "./tokens.dark";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  resolvedMode: "light" | "dark"; // Actual theme being used (system resolved)
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("system");

  // Resolve system preference to actual light/dark
  const resolvedMode: "light" | "dark" =
    mode === "system" ? (systemColorScheme === "dark" ? "dark" : "light") : mode;

  const theme = (resolvedMode === "light" ? lightTheme : darkTheme) as Theme;

  const toggleTheme = () => {
    setMode((prev) => {
      if (prev === "system") return "dark";
      if (prev === "dark") return "light";
      return "system";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, resolvedMode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
