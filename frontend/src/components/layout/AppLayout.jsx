import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import CommandPalette from "./CommandPalette.jsx";
import styles from "./AppLayout.module.css";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

const COLLAPSE_KEY = "shortlist.sidebarCollapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/** The frame around every logged-in page: sidebar, top bar, page content, command palette. */
export default function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { pathname } = useLocation();

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, current ? "0" : "1");
      } catch {
        // fine, it just won't be remembered
      }
      return !current;
    });
  }, []);

  // Ctrl/Cmd+K opens the command palette, Ctrl/Cmd+B toggles the sidebar
  useEffect(() => {
    function onKey(event) {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setIsPaletteOpen((open) => !open);
      } else if (key === "b") {
        event.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  // new page: start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={`${styles.shell} ${isCollapsed ? styles.collapsed : ""}`}>
      <Sidebar
        isOpen={isMenuOpen}
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
        onNavigate={() => setIsMenuOpen(false)}
        onOpenSearch={() => setIsPaletteOpen(true)}
      />

      {isMenuOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={styles.main}>
        <Topbar onOpenMenu={() => setIsMenuOpen(true)} onOpenSearch={() => setIsPaletteOpen(true)} />
        <main className={styles.content} key={pathname}>
          <Outlet />
        </main>
      </div>

      {isPaletteOpen && <CommandPalette onClose={() => setIsPaletteOpen(false)} />}
    </div>
  );
}
