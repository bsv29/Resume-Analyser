import styles from "./charts.module.css";

/** Horizontal bars: how often each skill was missing. Plain CSS, no chart library needed. */
export default function SkillBars({ skills }) {
  const highest = Math.max(...skills.map((item) => item.count));

  return (
    <ul className={styles.bars}>
      {skills.map((item) => (
        <li key={item.skill}>
          <div className={styles.barHead}>
            <span>{item.skill}</span>
            <span className={styles.barCount}>
              {item.count} {item.count === 1 ? "time" : "times"}
            </span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${(item.count / highest) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
