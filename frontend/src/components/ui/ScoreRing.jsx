import { scoreLevel } from "../../utils/format.js";
import styles from "./ScoreRing.module.css";

const SIZE = 132;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Circular gauge. The coloured arc covers score% of the circle. */
export default function ScoreRing({ score }) {
  const filled = (Math.min(Math.max(score, 0), 100) / 100) * CIRCUMFERENCE;

  return (
    <div className={styles.ring} role="img" aria-label={`Match score ${Math.round(score)} out of 100`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle className={styles.track} cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
        <circle
          className={`${styles.arc} ${styles[scoreLevel(score)]}`}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          // start the arc at the top instead of at 3 o'clock
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <div className={styles.label}>
        <span className={styles.value}>{Math.round(score)}</span>
        <span className={styles.outOf}>out of 100</span>
      </div>
    </div>
  );
}
