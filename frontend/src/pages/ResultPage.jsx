import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getMatch } from "../api/client.js";
import MarkedDescription from "../components/MarkedDescription.jsx";
import ScoreSummary from "../components/ScoreSummary.jsx";
import SkillGroup from "../components/SkillGroup.jsx";
import PageMessage from "../components/ui/PageMessage.jsx";
import ScoreRing from "../components/ui/ScoreRing.jsx";
import useApi from "../hooks/useApi.js";
import { formatDate, scoreLevel } from "../utils/format.js";
import styles from "./ResultPage.module.css";

export default function ResultPage() {
  const { matchId } = useParams();
  const { data: match, error, isLoading } = useApi(() => getMatch(matchId), [matchId]);

  if (isLoading) {
    return <PageMessage title="Loading the analysis…" />;
  }

  if (error) {
    return (
      <PageMessage title="This analysis could not be opened" text={error}>
        <Link to="/analyze" className="button">
          Start a new analysis
        </Link>
      </PageMessage>
    );
  }

  const { result } = match;
  const requirements = result.requirements;
  const coveredCount = requirements.filter((item) => item.status === "covered").length;
  const gapCount = requirements.filter((item) => item.status === "missing").length;
  const askedSkillCount = result.matched_skills.length + result.missing_skills.length;

  return (
    <div className={styles.page}>
      <Link to="/history" className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to history
      </Link>

      <header className={`sheet ${styles.hero}`}>
        <ScoreRing score={result.overall_score} />

        <div className={styles.heroText}>
          <p className={`${styles.verdict} ${styles[scoreLevel(result.overall_score)]}`}>
            {result.verdict}
          </p>
          <h1>{match.job_title}</h1>
          <p className="muted">
            {match.resume_name}, analysed on {formatDate(match.created_at)}
          </p>
        </div>

        <dl className={styles.facts}>
          <div>
            <dt>Requirements covered</dt>
            <dd>
              {coveredCount} <span>of {requirements.length}</span>
            </dd>
          </div>
          <div>
            <dt>Skills matched</dt>
            <dd>
              {result.matched_skills.length} <span>of {askedSkillCount}</span>
            </dd>
          </div>
          <div>
            <dt>Gaps to close</dt>
            <dd>{gapCount}</dd>
          </div>
        </dl>
      </header>

      <div className={styles.layout}>
        <aside className={styles.side}>
          <ScoreSummary result={result} />

          <section className={`sheet ${styles.card}`}>
            <SkillGroup
              title="Missing from the resume"
              skills={result.missing_skills}
              tone="missing"
              emptyText="The resume has every skill this job description names."
            />
            <SkillGroup
              title="Matched"
              skills={result.matched_skills}
              tone="matched"
              emptyText="No named skill appears in both."
            />
            <SkillGroup
              title="In the resume, not asked for"
              skills={result.extra_skills}
              tone="extra"
              emptyText="None."
            />
          </section>

          <section className={`sheet ${styles.card}`}>
            <h2>What to change</h2>
            <ul className={styles.suggestions}>
              {result.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </section>
        </aside>

        <MarkedDescription requirements={requirements} />
      </div>
    </div>
  );
}
