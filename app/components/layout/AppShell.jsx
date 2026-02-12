"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "../theme/ThemeToggle";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "app.sidebarCollapsed";
const GITHUB_REPO_URL = "https://github.com/liuyihua2015/real-time-fund";

function MenuIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowLeftIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompassIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14.5 9.5l-2 5-5 2 2-5 5-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 3v1M12 20v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GitHubIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 2C6.477 2 2 6.566 2 12.2c0 4.506 2.865 8.328 6.839 9.677.5.096.682-.22.682-.49 0-.24-.008-.877-.013-1.72-2.782.62-3.369-1.37-3.369-1.37-.454-1.175-1.11-1.487-1.11-1.487-.908-.636.069-.623.069-.623 1.004.072 1.532 1.053 1.532 1.053.892 1.555 2.341 1.106 2.91.846.092-.66.35-1.107.636-1.361-2.22-.26-4.555-1.133-4.555-5.046 0-1.115.39-2.026 1.03-2.741-.104-.26-.447-1.305.098-2.721 0 0 .84-.274 2.75 1.047A9.27 9.27 0 0 1 12 6.9c.85.004 1.705.118 2.504.345 1.909-1.321 2.748-1.047 2.748-1.047.546 1.416.203 2.461.1 2.721.64.715 1.028 1.626 1.028 2.741 0 3.923-2.338 4.783-4.566 5.038.36.317.68.944.68 1.903 0 1.374-.012 2.48-.012 2.816 0 .273.18.592.688.49A10.21 10.21 0 0 0 22 12.2C22 6.566 17.523 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function resolveTitle(pathname) {
  if (pathname === "/") return "总览";
  if (!pathname) return "";
  if (/^\/fund\/[^/]+\/trades/.test(pathname)) return "交易记录";
  if (/^\/fund\/[^/]+/.test(pathname)) return "基金详情";
  return "";
}

const navItems = [{ href: "/", label: "总览" }];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [version, setVersion] = useState("v1.0.0");

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await fetch(
          "https://api.github.com/repos/liuyihua2015/real-time-fund/tags",
        );
        if (res.ok) {
          const tags = await res.json();
          if (tags && tags.length > 0) {
            setVersion(tags[0].name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch version:", error);
      }
    };
    fetchVersion();
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (stored === null) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(stored === "1");
      }
    } catch {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        sidebarCollapsed ? "1" : "0",
      );
    } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavOpen]);

  const title = useMemo(() => resolveTitle(pathname), [pathname]);
  const showBack = pathname && pathname !== "/";

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <header className="app-topnav ui-glass">
        <div className="app-topnav-left">
          <button
            type="button"
            className="ui-icon-button app-burger"
            onClick={() => {
              if (window.innerWidth > 1024) {
                setSidebarCollapsed((prev) => !prev);
              } else {
                setMobileNavOpen((prev) => !prev);
              }
            }}
            aria-label={sidebarCollapsed ? "显示侧栏" : "隐藏侧栏"}
            aria-controls="app-sidebar"
            aria-expanded={mobileNavOpen}
            title={sidebarCollapsed ? "显示侧栏" : "隐藏侧栏"}
          >
            {mobileNavOpen ? (
              <CloseIcon width="18" height="18" />
            ) : sidebarCollapsed ? (
              <MenuIcon width="18" height="18" />
            ) : (
              <ArrowLeftIcon width="18" height="18" />
            )}
          </button>
          {showBack && (
            <button
              type="button"
              className="ui-icon-button"
              onClick={() => router.push("/")}
              aria-label="返回总览"
              title="返回总览"
            >
              <ArrowLeftIcon width="18" height="18" />
            </button>
          )}
          <Link className="app-brand" href="/" aria-label="估值罗盘">
            <CompassIcon width="18" height="18" />
            <span className="app-brand-text">估值罗盘</span>
          </Link>
          {title && <div className="app-title">{title}</div>}
        </div>
        <div className="app-topnav-right">
          <a
            className="ui-icon-button"
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="打开 GitHub 项目"
            title="GitHub"
          >
            <GitHubIcon width="18" height="18" />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <aside
        id="app-sidebar"
        className={`app-sidebar ui-glass ${mobileNavOpen ? "open" : ""}`}
      >
        <div className="app-sidebar-inner">
          <nav className="app-nav">
            {navItems.map((it) => {
              const active =
                it.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`app-nav-item ${active ? "active" : ""}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
          <div className="app-sidebar-footer">
            <span className="app-version">{version}</span>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          className="app-scrim"
          onClick={() => setMobileNavOpen(false)}
          aria-label="关闭导航"
        />
      )}

      <main className="app-main">
        <div className="app-container">{children}</div>
      </main>
    </div>
  );
}
