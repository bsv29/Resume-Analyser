import { ChevronRight, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext.jsx";
import { pageForPath } from "./navItems.js";
import styles from "./Topbar.module.css";

export default function Topbar({ onOpenMenu, onOpenSearch }) {
  const { pathname } = useLocation();
  const { theme, setPreference } = useTheme();
  const page = pageForPath(pathname);
  const isDark = theme === "dark";

  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.menu} onClick={onOpenMenu} aria-label="Open menu">
        <Menu size={18} aria-hidden="true" />
      </button>

      <nav className={styles.crumbs} aria-label="Breadcrumb">
        {page.section && (
          <>
            <span className={styles.crumb}>{page.section}</span>
            <ChevronRight size={14} className={styles.sep} aria-hidden="true" />
          </>
        )}
        <span className={styles.current}>{page.label}</span>
      </nav>

      <div className={styles.right}>
        <button type="button" className={`${styles.iconButton} ${styles.mobileOnly}`} onClick={onOpenSearch} aria-label="Search">
          <Search size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setPreference(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Light theme" : "Dark theme"}
        >
          {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        {pathname !== "/analyze" && (
          <Link to="/analyze" className="button">
            <Plus size={16} aria-hidden="true" />
            <span className={styles.newLabel}>New analysis</span>
          </Link>
        )}
      </div>
    </header>
  );
}
