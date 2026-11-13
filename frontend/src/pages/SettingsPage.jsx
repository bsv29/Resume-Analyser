import { Check, Download, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";

import { listMatches } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ACCENTS, useTheme } from "../context/ThemeContext.jsx";
import { exportMatchesCsv, initials } from "../utils/format.js";
import styles from "./SettingsPage.module.css";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const LEVELS = [
  { range: "75 - 100", verdict: "Strong match", chip: "chipGood" },
  { range: "55 - 74", verdict: "Decent match", chip: "chipAccent" },
  { range: "35 - 54", verdict: "Partial match", chip: "chipOkay" },
  { range: "0 - 34", verdict: "Weak match", chip: "chipBad" },
];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { preference, setPreference, accent, setAccent } = useTheme();
  const [exportState, setExportState] = useState(""); // "", "working", or an error

  async function handleExport() {
    setExportState("working");
    try {
      const matches = await listMatches();
      exportMatchesCsv(matches);
      setExportState("");
    } catch (requestError) {
      setExportState(requestError.message);
    }
  }

  return (
    <div className="pageStack">
      <div className="pageHead">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Settings</h1>
          <p>Your profile, how the app looks, and your data.</p>
        </div>
      </div>

      <section className={`sheet ${styles.profile}`}>
        <div className={styles.profileBody}>
          <span className={styles.avatar}>{initials(user.name)}</span>
          <div>
            <h2>{user.name}</h2>
            <p className="muted">{user.email}</p>
          </div>
          <span className="chip chipGood">Active</span>
        </div>
      </section>

      <div className="grid2">
        <section className="sheet card">
          <div className="cardHead">
            <div>
              <h2>Appearance</h2>
              <p className="cardNote">Saved in this browser</p>
            </div>
          </div>
          <div className={styles.themes} role="radiogroup" aria-label="Theme">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={preference === id}
                className={`${styles.theme} ${preference === id ? styles.themeOn : ""}`}
                onClick={() => setPreference(id)}
              >
                <span className={`${styles.preview} ${styles[`preview_${id}`]}`}>
                  <span />
                  <span />
                </span>
                <span className={styles.themeLabel}>
                  <Icon size={15} aria-hidden="true" /> {label}
                </span>
              </button>
            ))}
          </div>

          <p className={styles.subLabel}>Accent colour</p>
          <div className={styles.accents} role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={accent === option.id}
                aria-label={option.label}
                title={option.label}
                className={styles.swatch}
                style={{ background: option.swatch }}
                onClick={() => setAccent(option.id)}
              >
                {accent === option.id && <Check size={15} strokeWidth={3} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </section>

        <section className="sheet card">
          <div className="cardHead">
            <div>
              <h2>How scores are graded</h2>
              <p className="cardNote">Final score = 60% meaning match + 40% skill match</p>
            </div>
          </div>
          <ul className={styles.levels}>
            {LEVELS.map((level) => (
              <li key={level.verdict}>
                <span className={styles.range}>{level.range}</span>
                <span className={`chip ${level.chip}`}>{level.verdict}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="sheet card">
        <div className="cardHead">
          <div>
            <h2>Your data</h2>
            <p className="cardNote">Download every saved analysis, or sign out of this browser</p>
          </div>
        </div>
        <div className={styles.dataRow}>
          <button type="button" className="buttonQuiet" onClick={handleExport} disabled={exportState === "working"}>
            <Download size={15} aria-hidden="true" />
            {exportState === "working" ? "Preparing…" : "Export all analyses (CSV)"}
          </button>
          <button type="button" className={`buttonQuiet ${styles.signOut}`} onClick={logout}>
            <LogOut size={15} aria-hidden="true" /> Log out
          </button>
        </div>
        {exportState && exportState !== "working" && (
          <p className={styles.error} role="alert">
            {exportState}
          </p>
        )}
      </section>
    </div>
  );
}
