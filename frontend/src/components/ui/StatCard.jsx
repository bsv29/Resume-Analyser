import styles from "./StatCard.module.css";

/** One number on the dashboard. `icon` is a lucide-react component. */
export default function StatCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  return (
    <div className={`sheet ${styles.card}`}>
      <span className={`${styles.icon} ${styles[tone]}`}>
        <Icon size={20} strokeWidth={2} aria-hidden="true" />
      </span>
      <div>
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value}</p>
        <p className={styles.hint}>{hint}</p>
      </div>
    </div>
  );
}
