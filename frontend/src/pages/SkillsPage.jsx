import { Award, Layers, Search, Sparkles, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getSkillInsights } from "../api/client.js";
import PageMessage from "../components/ui/PageMessage.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import useApi from "../hooks/useApi.js";
import styles from "./SkillsPage.module.css";

const FILTERS = [
  { id: "all", label: "All skills" },
  { id: "strength", label: "Strengths" },
  { id: "gap", label: "Gaps" },
];

// A skill is a strength when the resume covered it in most jobs that asked.
function standing(skill) {
  if (skill.coverage >= 70) return { id: "strength", label: "Strength", chip: "chipGood", color: "var(--good)" };
  if (skill.coverage >= 30) return { id: "mixed", label: "Inconsistent", chip: "chipOkay", color: "var(--amber-mark)" };
  return { id: "gap", label: "Gap", chip: "chipBad", color: "var(--bad)" };
}

export default function SkillsPage() {
  const { data, error, isLoading } = useApi(getSkillInsights);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    if (!data) return [];
    const text = query.trim().toLowerCase();
    return data.skills
      .map((skill) => ({ ...skill, standing: standing(skill) }))
      .filter((skill) => filter === "all" || skill.standing.id === filter)
      .filter((skill) => !text || skill.skill.toLowerCase().includes(text));
  }, [data, filter, query]);

  if (isLoading) return <PageMessage title="Loading skill insights…" />;
  if (error) return <PageMessage title="Skill insights could not be loaded" text={error} />;

  if (data.unique_skills === 0) {
    return (
      <div className={`sheet emptyCard`}>
        <span className="eyebrow">Skills insights</span>
        <h1>No skills to show yet</h1>
        <p className="muted">
          Run an analysis against a job description that names skills (React, SQL, Docker, …) and this
          page will show which ones you cover and which ones you keep missing.
        </p>
        <Link to="/analyze" className="button">
          Run an analysis
        </Link>
      </div>
    );
  }

  const strengths = data.skills.filter((s) => s.coverage >= 70).slice(0, 6);
  const gaps = [...data.skills]
    .filter((s) => s.missing > 0)
    .sort((a, b) => b.missing - a.missing || a.coverage - b.coverage)
    .slice(0, 6);

  return (
    <div className="pageStack">
      <div className="pageHead">
        <div>
          <span className="eyebrow">Insights</span>
          <h1>Skills insights</h1>
          <p>Every skill the jobs asked for, across {data.total_checks} analyses, and how often your resume had it.</p>
        </div>
      </div>

      <div className="grid4">
        <StatCard icon={Layers} label="Skills asked for" value={data.unique_skills} hint="Distinct skills" />
        <StatCard
          icon={Target}
          tone="green"
          label="Skill coverage"
          value={`${Math.round(data.overall_coverage ?? 0)}%`}
          hint="Of all skills asked"
        />
        <StatCard icon={Award} tone="amber" label="Strengths" value={strengths.length} hint="Covered 70%+ of the time" />
        <StatCard icon={Sparkles} tone="slate" label="Bonus skills" value={data.extras.length} hint="You have, jobs didn't ask" />
      </div>

      <div className="grid2">
        <section className={`sheet card ${styles.panel}`}>
          <div className="cardHead">
            <div>
              <h2>Your strengths</h2>
              <p className="cardNote">Skills you cover in most jobs that ask for them</p>
            </div>
            <span className="chip chipGood">{strengths.length}</span>
          </div>
          {strengths.length ? (
            <SkillMeters skills={strengths} color="var(--good)" value={(s) => s.coverage} suffix="% covered" />
          ) : (
            <p className="muted">No skill reaches 70% coverage yet.</p>
          )}
        </section>

        <section className={`sheet card ${styles.panel}`}>
          <div className="cardHead">
            <div>
              <h2>Focus areas</h2>
              <p className="cardNote">Missing most often. Learning these lifts the most scores</p>
            </div>
            <span className="chip chipBad">{gaps.length}</span>
          </div>
          {gaps.length ? (
            <SkillMeters
              skills={gaps}
              color="var(--bad)"
              value={(s) => (s.missing / s.asked) * 100}
              label={(s) => `missing in ${s.missing} of ${s.asked}`}
            />
          ) : (
            <p className="muted">No gaps. Your resume covered every skill asked for.</p>
          )}
        </section>
      </div>

      <section className="sheet card">
        <div className={`cardHead ${styles.tableHead}`}>
          <div>
            <h2>All skills</h2>
            <p className="cardNote">Most asked first</p>
          </div>
          <div className={styles.tools}>
            <div className={styles.search}>
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                className="input"
                placeholder="Find a skill"
                aria-label="Find a skill"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="segmented" role="group" aria-label="Filter skills">
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={filter === option.id}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="tableScroll">
          {rows.length === 0 ? (
            <p className="muted">No skill matches this filter.</p>
          ) : (
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th className="num">Asked</th>
                  <th className="num">Had it</th>
                  <th className="num">Missing</th>
                  <th className={styles.coverageCol}>Coverage</th>
                  <th>Standing</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((skill) => (
                  <tr key={skill.skill}>
                    <td className={styles.skillName}>{skill.skill}</td>
                    <td className="num">{skill.asked}</td>
                    <td className="num">{skill.matched}</td>
                    <td className="num">{skill.missing}</td>
                    <td>
                      <div className={styles.coverage}>
                        <div className="meter">
                          <span style={{ width: `${skill.coverage}%`, background: skill.standing.color }} />
                        </div>
                        <span>{Math.round(skill.coverage)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`chip ${skill.standing.chip}`}>{skill.standing.label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {data.extras.length > 0 && (
        <section className="sheet card">
          <div className="cardHead">
            <div>
              <h2>Bonus skills you bring</h2>
              <p className="cardNote">On your resume but not asked for. Worth highlighting for the right role</p>
            </div>
          </div>
          <ul className="chipList">
            {data.extras.map((item) => (
              <li key={item.skill} className="chip chipAccent">
                {item.skill}
                <span className={styles.extraCount}>×{item.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SkillMeters({ skills, color, value, suffix = "", label }) {
  return (
    <ul className={styles.meters}>
      {skills.map((skill) => (
        <li key={skill.skill}>
          <div className={styles.meterHead}>
            <span>{skill.skill}</span>
            <span className={styles.meterValue}>
              {label ? label(skill) : `${Math.round(value(skill))}${suffix}`}
            </span>
          </div>
          <div className="meter">
            <span style={{ width: `${Math.max(value(skill), 3)}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
