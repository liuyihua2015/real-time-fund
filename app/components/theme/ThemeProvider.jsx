"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "ui-theme";

const ThemeContext = createContext(null);

function normalizeTheme(value) {
  if (value === "light" || value === "dark") return value;
  return null;
}

function readThemeFromDom() {
  if (typeof document === "undefined") return null;
  return normalizeTheme(document.documentElement?.dataset?.theme);
}

function readThemeFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

function readThemeFromSystem() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

function applyThemeToDom(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function persistTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const next =
      readThemeFromDom() || readThemeFromStorage() || readThemeFromSystem();
    setTheme(next);
    applyThemeToDom(next);
  }, []);

  useEffect(() => {
    if (!theme) return;
    applyThemeToDom(theme);
    persistTheme(theme);
  }, [theme]);

  const value = useMemo(() => {
    const safeTheme = theme === "dark" ? "dark" : "light";
    return {
      theme: safeTheme,
      setTheme: (next) => setTheme(normalizeTheme(next) || "light"),
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "light", setTheme: () => {}, toggleTheme: () => {} };
  }
  return ctx;
}
