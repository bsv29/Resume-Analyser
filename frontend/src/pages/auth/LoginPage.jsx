import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import styles from "./AuthForm.module.css";
import AuthLayout from "./AuthLayout.jsx";
import PasswordField from "./PasswordField.jsx";
import { checkEmail } from "./validation.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const found = {
      email: checkEmail(email),
      password: password ? "" : "Enter your password.",
    };
    setErrors(found);
    if (found.email || found.password) return;

    setIsSubmitting(true);
    setServerError("");
    try {
      await login({ email: email.trim(), password });
      // go back to the page the user first asked for, if there was one
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      setServerError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {serverError && (
          <p className={styles.alert} role="alert">
            {serverError}
          </p>
        )}

        <div className={styles.field}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className={`input ${errors.email ? styles.invalid : ""}`}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
        </div>

        <PasswordField
          id="login-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          error={errors.password}
        />

        <button type="submit" className={`button ${styles.submit}`} disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}
