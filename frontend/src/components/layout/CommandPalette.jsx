import { CornerDownLeft, FileText, LogOut, Moon, Search, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listMatches } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import { NAV_SECTIONS } from "./navItems.js";
import styles from "./CommandPalette.module.css";

/**
 * Ctrl/Cmd+K launcher: jump to any page, open a saved analysis, or run an
 * action. Arrow keys move, Enter runs, Escape closes.
 */
export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, setPreference } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [matches, setMatches] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    listMatches()
      .then((rows) => setMatches(rows.slice(0, 30)))
      .catch(() => setMatches([]));
  }, []);

  const groups = useMemo(() => {
    const text = query.trim().toLowerCase();
    const has = (...parts) => !text || parts.some((part) => part.toLowerCase().includes(text));

    const pages = NAV_SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => has(item.label, item.hint, section.label))
        .map((item) => ({
          id: item.to,
          icon: item.icon,
          label: item.label,
          meta: item.hint,
          run: () => navigate(item.to),
        }))
    );

    const analyses = matches
      .filter((match) => has(match.job_title, match.resume_name, match.verdict))
      .slice(0, text ? 8 : 4)
      .map((match) => ({
        id: match.id,
        icon: FileText,
        label: match.job_title,
        meta: `${Math.round(match.overall_score)} · ${match.verdict}`,
        run: () => navigate(`/results/${match.id}`),
      }));

    const actions = [
      {
        id: "theme",
        icon: theme === "dark" ? Sun : Moon,
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        meta: "Appearance",
        run: () => setPreference(theme === "dark" ? "light" : "dark"),
      },
      { id: "logout", icon: LogOut, label: "Log out", meta: "Account", run: logout },
    ].filter((action) => has(action.label, action.meta));

    return [
      { title: "Pages", items: pages },
      { title: "Recent analyses", items: analyses },
      { title: "Actions", items: actions },
    ].filter((group) => group.items.length);
  }, [query, matches, theme, navigate, setPreference, logout]);

  const flat = groups.flatMap((group) => group.items);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function run(item) {
    onClose();
    item.run();
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (flat.length ? (index + 1) % flat.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (flat.length ? (index - 1 + flat.length) % flat.length : 0));
    } else if (event.key === "Enter" && flat[active]) {
      event.preventDefault();
      run(flat[active]);
    }
  }

  let index = -1;

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className={styles.inputRow}>
          <Search size={17} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, analyses and actions…"
            aria-label="Search"
          />
          <kbd>Esc</kbd>
        </div>

        <div className={styles.list} ref={listRef} role="listbox">
          {flat.length === 0 && <p className={styles.empty}>No results for “{query}”.</p>}
          {groups.map((group) => (
            <div key={group.title}>
              <p className={styles.groupTitle}>{group.title}</p>
              {group.items.map((item) => {
                index += 1;
                const itemIndex = index;
                const Icon = item.icon;
                return (
                  <button
                    key={`${group.title}-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={itemIndex === active}
                    data-active={itemIndex === active}
                    className={styles.item}
                    onMouseMove={() => setActive(itemIndex)}
                    onClick={() => run(item)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className={styles.itemLabel}>{item.label}</span>
                    <span className={styles.itemMeta}>{item.meta}</span>
                    {itemIndex === active && <CornerDownLeft size={14} className={styles.enter} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>↵</kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}
