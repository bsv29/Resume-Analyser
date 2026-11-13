import styles from "./FullScreenLoader.module.css";

export default function FullScreenLoader() {
  return (
    <div className={styles.wrap} role="status">
      <span className={styles.spinner} />
      <span className="visuallyHidden">Loading</span>
    </div>
  );
}
