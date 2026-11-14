import { BarChart3, CheckCircle2, ListOrdered, Moon, ScanSearch, Sun } from "lucide-react";

import BrandMark from "../../components/layout/BrandMark.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";
import styles from "./AuthLayout.module.css";

const FEATURES = [
  { icon: ScanSearch, text: "Every job requirement marked as covered, loose or missing" },
  { icon: ListOrdered, text: "Rank up to 10 resumes against one job in seconds" },
  { icon: BarChart3, text: "Track your scores and skill gaps over time" },
];

/** Two-column frame shared by the login and register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, setPreference } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={styles.page}>
      {/* Left: product story. Always dark, whatever the theme. */}
      <section className={styles.showcase} aria-hidden="true">
        <div className={styles.glow} />
        <div className={styles.gridLines} />

        <div className={styles.brand}>
          <BrandMark size={30} />
          <span>Shortlist</span>
        </div>

        <div className={styles.story}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} /> AI resume matching
          </span>
          <h2 className={styles.headline}>
            Know where your resume stands <span>before you apply.</span>
          </h2>
          <ul className={styles.features}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className={styles.featureIcon}>
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* a small, static sample of the result page */}
        <div className={styles.preview}>
          <div className={styles.previewHead}>
            <div>
              <p className={styles.previewLabel}>Analysis result</p>
              <p className={styles.previewTitle}>Junior ML Engineer</p>
            </div>
            <div className={styles.previewRing}>
              <svg viewBox="0 0 44 44" width="52" height="52">
                <circle cx="22" cy="22" r="18" className={styles.ringTrack} />
                <circle cx="22" cy="22" r="18" className={styles.ringArc} strokeDasharray={`${0.78 * 113} 113`} />
              </svg>
              <span>78</span>
            </div>
          </div>
          <ul className={styles.previewLines}>
            <li>
              <CheckCircle2 size={14} className={styles.okIcon} />
              <span className={styles.covered}>Fine-tune transformer models with PyTorch</span>
            </li>
            <li>
              <CheckCircle2 size={14} className={styles.partialIcon} />
              <span className={styles.partial}>Build REST APIs for model serving</span>
            </li>
            <li>
              <span className={styles.missingDot} />
              <span className={styles.missing}>Deploy with Docker and Kubernetes</span>
            </li>
          </ul>
          <div className={styles.previewChips}>
            <span className={styles.chipOk}>PyTorch</span>
            <span className={styles.chipOk}>FastAPI</span>
            <span className={styles.chipGap}>Kubernetes</span>
          </div>
        </div>
      </section>

      {/* Right: the form */}
      <section className={styles.formSide}>
        <div className={styles.formTop}>
          <div className={styles.mobileBrand}>
            <BrandMark size={28} />
            <span>Shortlist</span>
          </div>
          <button
            type="button"
            className={styles.themeButton}
            onClick={() => setPreference(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className={styles.formBox}>
          <h1>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
          <p className={styles.footer}>{footer}</p>
        </div>

        <p className={styles.legal}>Your analyses are private to your account.</p>
      </section>
    </div>
  );
}
