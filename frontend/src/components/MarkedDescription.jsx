import { useState } from "react";

import styles from "./MarkedDescription.module.css";

const FILTERS = [
  { value: "all", label: "All lines" },
  { value: "gaps", label: "Gaps only" },
];

const STATUS_TEXT = {
  covered: "Covered",
  partial: "Loosely covered",
  missing: "Not in resume",
};

export default function MarkedDescription({ requirements }) {
  const [filter, setFilter] = useState("all");

  const gapCount = requirements.filter((item) => item.status !== "covered").length;
  const visible =
    filter === "gaps" ? requirements.filter((item) => item.status !== "covered") : requirements;

  return (
    <section className={`sheet ${styles.wrapper}`}>
      <div className={styles.head}>
        <div>
          <h2>Job description, marked against the resume</h2>
          <p className={styles.legend}>
            <span className={styles.covered}>Green</span> is covered,{" "}
            <span className={styles.partial}>yellow</span> is loosely covered,{" "}
            <span className={styles.missing}>underlined red</span> is not in the resume.
          </p>
        </div>

        <div className={styles.filter} role="group" aria-label="Filter lines">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filter === option.value ? styles.filterActive : styles.filterButton}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
              {option.value === "gaps" && ` (${gapCount})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>No gaps. Every line of the job description is covered.</p>
      ) : (
        <ol className={styles.lines}>
          {visible.map((item) => (
            <li key={item.requirement} className={styles.line}>
              <p className={styles.requirement}>
                <span className={styles[item.status]}>{item.requirement}</span>
              </p>

              <div className={styles.evidence}>
                <p className={styles.status}>
                  {STATUS_TEXT[item.status]}
                  <span className={styles.similarity}>similarity {item.similarity.toFixed(2)}</span>
                </p>
                {item.best_resume_line ? (
                  <p className={styles.resumeLine}>Closest resume line: {item.best_resume_line}</p>
                ) : (
                  <p className={styles.resumeLine}>No resume line is close to this.</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
