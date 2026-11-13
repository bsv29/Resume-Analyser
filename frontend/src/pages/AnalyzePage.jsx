import { ScanSearch } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createMatch } from "../api/client.js";
import FileDrop from "../components/FileDrop.jsx";
import styles from "./AnalyzePage.module.css";

const MIN_CHARS = 50;

export default function AnalyzePage() {
  const navigate = useNavigate();

  const [resumeMode, setResumeMode] = useState("upload"); // "upload" | "paste"
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");

  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const hasResume =
    resumeMode === "upload" ? Boolean(resumeFile) : resumeText.trim().length >= MIN_CHARS;
  const hasJd = jdText.trim().length >= MIN_CHARS;
  const canSubmit = hasResume && hasJd && !isChecking;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsChecking(true);
    setError("");

    try {
      const usingFile = resumeMode === "upload";
      const match = await createMatch({
        jdText,
        resumeFile: usingFile ? resumeFile : null,
        resumeText: usingFile ? "" : resumeText,
      });
      navigate(`/results/${match.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setIsChecking(false);
    }
  }

  return (
    <form className={styles.page} onSubmit={handleSubmit}>
      <div>
        <h1>Analyse a resume against a job</h1>
        <p className={styles.lead}>
          Add the resume and the job description. You get a score, the gaps, and the skills to add.
        </p>
      </div>

      <div className={styles.columns}>
        <section className={`sheet ${styles.panel}`}>
          <div className={styles.panelHead}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>1</span>
              <h2>Resume</h2>
            </div>
            <div className={styles.modeSwitch} role="group" aria-label="How to add the resume">
              <button
                type="button"
                className={resumeMode === "upload" ? styles.modeActive : styles.mode}
                aria-pressed={resumeMode === "upload"}
                onClick={() => setResumeMode("upload")}
              >
                Upload PDF
              </button>
              <button
                type="button"
                className={resumeMode === "paste" ? styles.modeActive : styles.mode}
                aria-pressed={resumeMode === "paste"}
                onClick={() => setResumeMode("paste")}
              >
                Paste text
              </button>
            </div>
          </div>

          {resumeMode === "upload" ? (
            <FileDrop file={resumeFile} onChange={setResumeFile} />
          ) : (
            <>
              <label htmlFor="resume-text" className="visuallyHidden">
                Resume text
              </label>
              <textarea
                id="resume-text"
                className={`input ${styles.textarea}`}
                placeholder="Paste the full resume text here"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
              />
            </>
          )}
        </section>

        <section className={`sheet ${styles.panel}`}>
          <div className={styles.panelHead}>
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <h2>
                <label htmlFor="jd-text">Job description</label>
              </h2>
            </div>
            <span className={styles.counter}>{jdText.trim().length} characters</span>
          </div>
          <textarea
            id="jd-text"
            className={`input ${styles.textarea}`}
            placeholder="Paste the job description. Keep the requirements as separate lines or bullets."
            value={jdText}
            onChange={(event) => setJdText(event.target.value)}
          />
        </section>
      </div>

      <div className={`sheet ${styles.actions}`}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : (
          <p className="muted">
            {isChecking
              ? "Comparing each requirement with the resume. This takes a few seconds."
              : "The result is saved to your history, so you can reopen it any time."}
          </p>
        )}
        <button type="submit" className="button" disabled={!canSubmit}>
          <ScanSearch size={18} aria-hidden="true" />
          {isChecking ? "Analysing…" : "Analyse match"}
        </button>
      </div>
    </form>
  );
}
