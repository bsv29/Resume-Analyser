import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Appearance choices, kept per browser:
//   preference: "light" | "dark" | "system"
//   accent:     one of ACCENTS
export const ACCENTS = [
  { id: "indigo", label: "Indigo", swatch: "#4f46e5" },
  { id: "blue", label: "Blue", swatch: "#2563eb" },
  { id: "violet", label: "Violet", swatch: "#7c3aed" },
  { id: "emerald", label: "Emerald", swatch: "#059669" },
  { id: "rose", label: "Rose", swatch: "#e11d48" },
  { id: "amber", label: "Amber", swatch: "#d97706" },
];

const THEME_KEY = "shortlist.theme";
const ACCENT_KEY = "shortlist.accent";
const ThemeContext = createContext(null);

function read(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // the choice still applies until the tab closes
  }
}

const darkQuery = () => window.matchMedia?.("(prefers-color-scheme: dark)");

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(() => read(THEME_KEY, "system"));
  const [accent, setAccentState] = useState(() => read(ACCENT_KEY, "indigo"));
  const [system, setSystem] = useState(() => (darkQuery()?.matches ? "dark" : "light"));

  // follow the OS setting while the preference is "system"
  useEffect(() => {
    const query = darkQuery();
    if (!query) return undefined;
    const onChange = () => setSystem(query.matches ? "dark" : "light");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const theme = preference === "system" ? system : preference;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.accent = accent;
  }, [theme, accent]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      accent,
      setPreference(next) {
        setPreferenceState(next);
        write(THEME_KEY, next);
      },
      setAccent(next) {
        setAccentState(next);
        write(ACCENT_KEY, next);
      },
    }),
    [theme, preference, accent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
