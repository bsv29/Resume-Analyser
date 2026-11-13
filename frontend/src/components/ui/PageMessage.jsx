import styles from "./PageMessage.module.css";

/** Full-page loading, error or not-found message. */
export default function PageMessage({ title, text, children }) {
  return (
    <div className={styles.message} role="status">
      <h1>{title}</h1>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  );
}
