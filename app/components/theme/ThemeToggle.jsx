"use client";

import { useTheme } from "./ThemeProvider";

function SunIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a6.5 6.5 0 1 0 11.5 11.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ThemeToggle({ className = "" }) {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`ui-icon-button ${className}`}
      onClick={toggleTheme}
      aria-label="切换主题"
      title="切换主题"
    >
      <SunIcon className="theme-icon theme-icon--sun" width="18" height="18" />
      <MoonIcon className="theme-icon theme-icon--moon" width="18" height="18" />
    </button>
  );
}
