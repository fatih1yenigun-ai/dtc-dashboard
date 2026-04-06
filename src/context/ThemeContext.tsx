"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dtc-theme") as Theme | null;
    const initial = stored === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.className = document.documentElement.className
      .replace(/\b(dark|light)\b/g, "")
      .trim() + " " + initial;
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("dtc-theme", next);
    document.documentElement.className = document.documentElement.className
      .replace(/\b(dark|light)\b/g, "")
      .trim() + " " + next;
  };

  // Prevent flash — render children immediately but with default dark
  // The useEffect will correct the class on mount
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
