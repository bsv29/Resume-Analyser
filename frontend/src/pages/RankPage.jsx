import { ListOrdered } from "lucide-react";
import { useState } from "react";

import { rankResumes } from "../api/client.js";
import ResumeListInput from "../components/ResumeListInput.jsx";
import ScoreBadge from "../components/ui/ScoreBadge.jsx";
import styles from "./RankPage.module.css";

const MIN_CHARS = 50;
const MAX_FILES = 10;

export default function RankPage() {
  const [jdText, setJdText] = useState("");
  const [files, setFiles] = useState([]);

  const [ranking, setRanking] = useState(null);
  const [isRanking, setIsRanking] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = jdText.trim().length >= MIN_CHARS && files.length >= 2 && !isRanking;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsRanking(true);
    setError("");
    try {
      setRanking(await rankResumes({ jdText, resumeFiles: files }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRanking(false);
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <h1>Rank several resumes for one job</h1>
        <p className={styles.lead}>
          Upload the resumes you received and see them ordered by how well each fits the job.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.columns}>
          <section className={`sheet ${styles.panel}`}>
            <h2>
              <label htmlFor="rank-jd">Job description</label>
            </h2>
            <textarea
              id="rank-jd"
              className={`input ${styles.textarea}`}
              placeholder="Paste the job description. Keep the requirements as separate lines or bullets."
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
            />
          </section>

          <section className={`sheet ${styles.panel}`}>
            <h2>
              Resumes <span className={styles.count}>{files.length} added</span>
            </h2>
            <ResumeListInput files={files} onChange={setFiles} maxFiles={MAX_FILES} />
          </section>
        </div>

        <div className={`sheet ${styles.actions}`}>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : (
            <p className="muted">
              {isRanking
                ? "Scoring each resume. This takes a few seconds per file."
                : "Rankings are not saved. Run a single analysis to keep a detailed result."}
            </p>
          )}
          <button type="submit" className="button" disabled={!canSubmit}>
            <ListOrdered size={18} aria-hidden="true" />
            {isRanking ? "Ranking…" : "Rank resumes"}
          </button>
        </div>
      </form>

      {ranking && <RankingTable ranking={ranking} />}
    </div>
  );
}

function RankingTable({ ranking }) {
  return (
    <section className={styles.results} aria-live="polite">
      <h2>Ranking for {ranking.job_title}</h2>

      {ranking.ranked.length > 0 && (
        <div className={`sheet ${styles.tableWrap}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Resume</th>
                <th className={styles.right}>Score</th>
                <th className={styles.right}>Meaning</th>
                <th className={styles.right}>Skills</th>
                <th>Missing skills</th>
              </tr>
            </thead>
            <tbody>
              {ranking.ranked.map((resume) => (
                <tr key={resume.resume_name} className={resume.rank === 1 ? styles.best : ""}>
                  <td>
                    <span className={styles.rank}>{resume.rank}</span>
                  </td>
                  <td>
                    <span className={styles.name}>{resume.resume_name}</span>
                    <span className={styles.verdict}>{resume.verdict}</span>
                  </td>
                  <td className={styles.right}>
                    <ScoreBadge score={resume.overall_score} />
                  </td>
                  <td className={`${styles.right} ${styles.number}`}>
                    {Math.round(resume.semantic_score)}
                  </td>
                  <td className={`${styles.right} ${styles.number}`}>
                    {resume.skill_score === null ? "n/a" : Math.round(resume.skill_score)}
                  </td>
                  <td className={styles.missing}>
                    {resume.missing_skills.length === 0 ? "None" : resume.missing_skills.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ranking.skipped.length > 0 && (
        <div className={styles.skipped}>
          <h3>Could not be scored</h3>
          <ul>
            {ranking.skipped.map((item) => (
              <li key={item.resume_name}>
                {item.resume_name}: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
