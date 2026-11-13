import { Download, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { deleteMatch, listMatches } from "../api/client.js";
import PageMessage from "../components/ui/PageMessage.jsx";
import { COLOURS } from "../components/charts/VerdictDonut.jsx";
import useApi from "../hooks/useApi.js";
import { exportMatchesCsv, formatDate, timeAgo } from "../utils/format.js";
import styles from "./HistoryPage.module.css";

const VERDICTS = ["Strong match", "Decent match", "Partial match", "Weak match"];

export default function HistoryPage() {
  const { data: matches, setData: setMatches, error, isLoading } = useApi(listMatches);

  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState("all");
  const [pendingDeleteId, setPendingDeleteId] = useState(null); // row waiting for "Confirm"
  const [deleteError, setDeleteError] = useState("");

  // Filtering happens in the browser: the list is small (max 100 rows).
  const visible = useMemo(() => {
    if (!matches) return [];
    const text = query.trim().toLowerCase();
    return matches.filter((match) => {
      const matchesText =
        !text ||
        match.job_title.toLowerCase().includes(text) ||
        match.resume_name.toLowerCase().includes(text);
      const matchesVerdict = verdict === "all" || match.verdict === verdict;
      return matchesText && matchesVerdict;
    });
  }, [matches, query, verdict]);

  async function handleDelete(id) {
    setDeleteError("");
    try {
      await deleteMatch(id);
      // remove the row locally instead of fetching the whole list again
      setMatches((current) => current.filter((match) => match.id !== id));
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setPendingDeleteId(null);
    }
  }

  if (isLoading) return <PageMessage title="Loading your history…" />;
  if (error) return <PageMessage title="Your history could not be loaded" text={error} />;

  if (matches.length === 0) {
    return (
      <div className={`sheet ${styles.empty}`}>
        <h1>No analyses yet</h1>
        <p className="muted">Every analysis you run is saved here so you can reopen it later.</p>
        <Link to="/analyze" className="button">
          Run your first analysis
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>History</h1>
          <p className={styles.lead}>
            {matches.length} saved {matches.length === 1 ? "analysis" : "analyses"}, newest first.
          </p>
        </div>

        <div className={styles.filters}>
          <button
            type="button"
            className="buttonQuiet"
            onClick={() => exportMatchesCsv(visible)}
            disabled={!visible.length}
          >
            <Download size={15} aria-hidden="true" /> Export
          </button>
          <div className={styles.search}>
            <Search size={16} aria-hidden="true" />
            <label htmlFor="history-search" className="visuallyHidden">
              Search by job or resume
            </label>
            <input
              id="history-search"
              type="search"
              className="input"
              placeholder="Search job or resume"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <label htmlFor="history-verdict" className="visuallyHidden">
            Filter by result
          </label>
          <select
            id="history-verdict"
            className={`input ${styles.select}`}
            value={verdict}
            onChange={(event) => setVerdict(event.target.value)}
          >
            <option value="all">All results</option>
            {VERDICTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {deleteError && (
        <p className={styles.error} role="alert">
          {deleteError}
        </p>
      )}

      <div className={`sheet ${styles.tableWrap}`}>
        {visible.length === 0 ? (
          <p className={styles.noResults}>No analysis matches these filters.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Job</th>
                <th>Resume</th>
                <th>Verdict</th>
                <th>Score</th>
                <th>When</th>
                <th>
                  <span className="visuallyHidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((match) => (
                <tr key={match.id}>
                  <td>
                    <Link to={`/results/${match.id}`} className={styles.title}>
                      {match.job_title}
                    </Link>
                  </td>
                  <td className={styles.soft}>{match.resume_name}</td>
                  <td>
                    <span className={styles.verdict}>
                      <i style={{ background: COLOURS[match.verdict] }} />
                      {match.verdict}
                    </span>
                  </td>
                  <td>
                    <div className={styles.scoreCell}>
                      <span className={styles.scoreNum}>{Math.round(match.overall_score)}</span>
                      <span className={styles.scoreBar}>
                        <span style={{ width: `${match.overall_score}%`, background: COLOURS[match.verdict] }} />
                      </span>
                    </div>
                  </td>
                  <td className={`${styles.soft} ${styles.nowrap}`} title={formatDate(match.created_at)}>
                    {timeAgo(match.created_at)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                    {pendingDeleteId === match.id ? (
                      <>
                        <button
                          type="button"
                          className={`buttonQuiet ${styles.danger}`}
                          onClick={() => handleDelete(match.id)}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="buttonQuiet"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => setPendingDeleteId(match.id)}
                        aria-label={`Delete analysis for ${match.job_title}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
