import { scoreLevel } from "../utils/format.js";
import styles from "./ScoreSummary.module.css";

function ScoreRow({ label, hint, score }) {
  const hasScore = score !== null && score !== undefined;

  return (
    <div className={styles.row}>
      <div className={styles.rowHead}>
        <span>{label}</span>
        <span className={styles.rowValue}>{hasScore ? Math.round(score) : "n/a"}</span>
      </div>
      <div className={styles.track}>
        {hasScore && (
          <div
            className={`${styles.fill} ${styles[scoreLevel(score)]}`}
            style={{ width: `${score}%` }}
          />
        )}
      </div>
      <p className={styles.hint}>{hint}</p>
    </div>
  );
}

export default function ScoreSummary({ result }) {
  return (
    <section className={`sheet ${styles.summary}`} aria-label="Score breakdown">
      <h2>How the score is made</h2>

      <ScoreRow
        label="Meaning"
        score={result.semantic_score}
        hint="How close the resume lines are to each requirement, even when the wording differs."
      />
      <ScoreRow
        label="Skills"
        score={result.skill_score}
        hint={
          result.skill_score === null
            ? "The job description does not name any skill from our list, so only meaning is used."
            : "Share of the skills named in the job description that also appear in the resume."
        }
      />

      {result.skill_score !== null && (
        <p className={styles.formula}>Overall is 60% meaning and 40% skills.</p>
      )}
    </section>
  );
}
