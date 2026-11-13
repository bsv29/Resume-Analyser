import BrandMark from "../../components/layout/BrandMark.jsx";
import styles from "./AuthLayout.module.css";

/** Two-column frame shared by the login and register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className={styles.page}>
      <section className={styles.showcase} aria-hidden="true">
        <div className={styles.brand}>
          <BrandMark size={34} />
          <span>Shortlist</span>
        </div>

        <div>
          <p className={styles.headline}>Know where your resume stands before you apply.</p>
          <p className={styles.lead}>
            Every line of the job description, checked against your resume and marked.
          </p>
        </div>

        {/* a small sample of what the result page looks like */}
        <div className={styles.preview}>
          <div className={styles.previewHead}>
            <span>Junior ML Engineer</span>
            <span className={styles.previewScore}>78</span>
          </div>
          <p>
            <span className={styles.covered}>Fine-tune transformer models with PyTorch</span>
          </p>
          <p>
            <span className={styles.partial}>Build and document REST APIs for model serving</span>
          </p>
          <p>
            <span className={styles.missing}>Deploy services with Docker and Kubernetes</span>
          </p>
        </div>
      </section>

      <section className={styles.formSide}>
        <div className={styles.formBox}>
          <div className={styles.mobileBrand}>
            <BrandMark size={30} />
            <span>Shortlist</span>
          </div>
          <h1>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
          <p className={styles.footer}>{footer}</p>
        </div>
      </section>
    </div>
  );
}
