import { ArrowLeftRight, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getMatch, listMatches } from "../api/client.js";
import PageMessage from "../components/ui/PageMessage.jsx";
import ScoreRing from "../components/ui/ScoreRing.jsx";
import useApi from "../hooks/useApi.js";
import { formatDate } from "../utils/format.js";
import styles from "./ComparePage.module.css";

export default function ComparePage() {
  const { data: matches, error, isLoading } = useApi(listMatches);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");
  const [details, setDetails] = useState({});
  const [loadError, setLoadError] = useState("");

  // default to the two newest analyses
  useEffect(() => {
    if (matches?.length >= 2 && !leftId && !rightId) {
      setLeftId(matches[1].id);
      setRightId(matches[0].id);
    }
  }, [matches, leftId, rightId]);

  // fetch full results for whichever ids are picked (cached by id)
  useEffect(() => {
    [leftId, rightId]
      .filter((id) => id && !details[id])
      .forEach((id) =>
        getMatch(id)
          .then((detail) => setDetails((current) => ({ ...current, [id]: detail })))
          .catch((requestError) => setLoadError(requestError.message))
      );
  }, [leftId, rightId, details]);

  if (isLoading) return <PageMessage title="Loading your analyses…" />;
  if (error) return <PageMessage title="Your analyses could not be loaded" text={error} />;

  if (matches.length < 2) {
    return (
      <div className="sheet emptyCard">
        <span className="eyebrow">Compare</span>
        <h1>You need at least two analyses</h1>
        <p className="muted">
          Compare puts two saved analyses side by side: e.g. the same resume before and after an edit, or
          one resume against two different jobs.
        </p>
        <Link to="/analyze" className="button">
          Run an analysis
        </Link>
      </div>
    );
  }

  const left = details[leftId];
  const right = details[rightId];

  return (
    <div className="pageStack">
      <div className="pageHead">
        <div>
          <span className="eyebrow">Insights</span>
          <h1>Compare analyses</h1>
          <p>Pick two saved analyses to see how the scores and skills differ.</p>
        </div>
      </div>

      <div className={`sheet ${styles.pickers}`}>
        <Picker label="Analysis A" value={leftId} onChange={setLeftId} matches={matches} />
        <button
          type="button"
          className={styles.swap}
          onClick={() => {
            setLeftId(rightId);
            setRightId(leftId);
          }}
          aria-label="Swap A and B"
          title="Swap"
        >
          <ArrowLeftRight size={18} aria-hidden="true" />
        </button>
        <Picker label="Analysis B" value={rightId} onChange={setRightId} matches={matches} />
      </div>

      {loadError && (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      )}

      {!left || !right ? (
        <PageMessage title="Loading comparison…" />
      ) : (
        <Comparison left={left} right={right} />
      )}
    </div>
  );
}

function Picker({ label, value, onChange, matches }) {
  const id = `pick-${label.replace(/\s/g, "")}`;
  return (
    <div className={styles.picker}>
      <label htmlFor={id}>{label}</label>
      <select id={id} className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {matches.map((match) => (
          <option key={match.id} value={match.id}>
            {match.job_title} · {match.resume_name} · {Math.round(match.overall_score)}
          </option>
        ))}
      </select>
    </div>
  );
}

function Comparison({ left, right }) {
  const a = left.result;
  const b = right.result;

  const rows = [
    { label: "Overall score", a: a.overall_score, b: b.overall_score },
    { label: "Meaning score", a: a.semantic_score, b: b.semantic_score },
    { label: "Skill score", a: a.skill_score, b: b.skill_score },
    { label: "Requirements covered", a: countStatus(a, "covered"), b: countStatus(b, "covered"), plain: true },
    { label: "Requirements missing", a: countStatus(a, "missing"), b: countStatus(b, "missing"), plain: true, lowerIsBetter: true },
  ];

  const matchedA = new Set(a.matched_skills);
  const matchedB = new Set(b.matched_skills);
  const both = a.matched_skills.filter((s) => matchedB.has(s));
  const onlyA = a.matched_skills.filter((s) => !matchedB.has(s));
  const onlyB = b.matched_skills.filter((s) => !matchedA.has(s));
  const missingBoth = a.missing_skills.filter((s) => b.missing_skills.includes(s));

  return (
    <>
      <div className={styles.heads}>
        <Side tag="A" record={left} />
        <Side tag="B" record={right} />
      </div>

      <section className="sheet card">
        <div className="cardHead">
          <h2>Score breakdown</h2>
          <span className="cardNote">Change is B minus A</span>
        </div>
        <div className="tableScroll">
          <table className="dataTable">
            <thead>
              <tr>
                <th>Measure</th>
                <th className="num">A</th>
                <th className="num">B</th>
                <th className="num">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className={styles.measure}>{row.label}</td>
                  <td className="num">{show(row.a)}</td>
                  <td className="num">{show(row.b)}</td>
                  <td className="num">
                    <Delta a={row.a} b={row.b} lowerIsBetter={row.lowerIsBetter} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid2">
        <SkillCard title="Matched in both" tone="chipGood" skills={both} empty="No shared matched skills." />
        <SkillCard title="Missing in both" tone="chipBad" skills={missingBoth} empty="Nothing missing in both." />
        <SkillCard title="Matched only in A" tone="chipAccent" skills={onlyA} empty="Nothing unique to A." />
        <SkillCard title="Matched only in B" tone="chipAccent" skills={onlyB} empty="Nothing unique to B." />
      </div>
    </>
  );
}

function Side({ tag, record }) {
  return (
    <Link to={`/results/${record.id}`} className={`sheet ${styles.side}`}>
      <ScoreRing score={record.result.overall_score} />
      <div className={styles.sideText}>
        <span className={styles.tag}>{tag}</span>
        <h2>{record.job_title}</h2>
        <p className="muted">{record.resume_name}</p>
        <p className={styles.sideMeta}>
          {record.result.verdict} · {formatDate(record.created_at)}
        </p>
      </div>
    </Link>
  );
}

function SkillCard({ title, tone, skills, empty }) {
  return (
    <section className="sheet card">
      <div className="cardHead">
        <h2>{title}</h2>
        <span className={`chip ${tone}`}>{skills.length}</span>
      </div>
      {skills.length ? (
        <ul className="chipList">
          {skills.map((skill) => (
            <li key={skill} className={`chip ${tone}`}>
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  );
}

function Delta({ a, b, lowerIsBetter }) {
  if (a == null || b == null) return <span className="muted">-</span>;
  const diff = Math.round(b - a);
  if (diff === 0) {
    return (
      <span className="chip chipSlate">
        <Minus size={13} aria-hidden="true" /> 0
      </span>
    );
  }
  const better = lowerIsBetter ? diff < 0 : diff > 0;
  const Icon = diff > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`chip ${better ? "chipGood" : "chipBad"}`}>
      <Icon size={13} aria-hidden="true" />
      {diff > 0 ? "+" : ""}
      {diff}
    </span>
  );
}

function countStatus(result, status) {
  return result.requirements.filter((r) => r.status === status).length;
}

function show(value) {
  return value == null ? "-" : Math.round(value);
}
