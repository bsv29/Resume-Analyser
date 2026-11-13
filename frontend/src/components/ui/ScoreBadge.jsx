import { scoreLevel } from "../../utils/format.js";
import styles from "./ScoreBadge.module.css";

/** Small coloured pill with a score, used in tables. */
export default function ScoreBadge({ score }) {
  return <span className={`${styles.badge} ${styles[scoreLevel(score)]}`}>{Math.round(score)}</span>;
}
