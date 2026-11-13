import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import styles from "./AuthForm.module.css";

/** Password input with a show/hide button. Used by both auth pages. */
export default function PasswordField({ id, value, onChange, autoComplete, error, hint }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>Password</label>
      <div className={styles.passwordWrap}>
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          className={`input ${error ? styles.invalid : ""}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
      {error ? <p className={styles.fieldError}>{error}</p> : hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
