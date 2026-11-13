import { LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { initials } from "../../utils/format.js";
import BrandMark from "./BrandMark.jsx";
import { NAV_SECTIONS } from "./navItems.js";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, isCollapsed, onToggleCollapsed, onNavigate, onOpenSearch }) {
  const { user, logout } = useAuth();
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${isCollapsed ? styles.collapsed : ""}`}
      aria-label="Sidebar"
    >
      <div className={styles.top}>
        <div className={styles.brand}>
          <BrandMark size={28} />
          <span className={styles.brandName}>Shortlist</span>
        </div>
        <button
          type="button"
          className={styles.collapse}
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={`${isCollapsed ? "Expand" : "Collapse"} sidebar (${isMac ? "⌘" : "Ctrl"}+B)`}
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      <button type="button" className={styles.search} onClick={onOpenSearch} title="Search">
        <Search size={15} aria-hidden="true" />
        <span className={styles.label}>Search…</span>
        <kbd className={styles.kbd}>{isMac ? "⌘" : "Ctrl"} K</kbd>
      </button>

      <nav className={styles.nav} aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className={styles.section}>
            <p className={styles.sectionLabel}>{section.label}</p>
            {section.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                title={isCollapsed ? label : undefined}
                className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
              >
                <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                <span className={styles.label}>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.account}>
        <span className={styles.avatar}>{initials(user.name)}</span>
        <div className={styles.who}>
          <p className={styles.name}>{user.name}</p>
          <p className={styles.email}>{user.email}</p>
        </div>
        <button type="button" className={styles.logout} onClick={logout} aria-label="Log out" title="Log out">
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
