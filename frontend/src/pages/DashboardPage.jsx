import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Download,
  FileSearch,
  Lightbulb,
  ListOrdered,
  Target,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getDashboard, listMatches } from "../api/client.js";
import ActivityHeatmap from "../components/charts/ActivityHeatmap.jsx";
import Sparkline from "../components/charts/Sparkline.jsx";
import { COLOURS } from "../components/charts/VerdictDonut.jsx";
import PageMessage from "../components/ui/PageMessage.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { exportMatchesCsv, formatShortDate, greeting, timeAgo } from "../utils/format.js";
import styles from "./DashboardPage.module.css";

const RANGES = [
  { id: 7, label: "7D" },
  { id: 30, label: "30D" },
  { id: 90, label: "90D" },
  { id: 0, label: "All" },
];
const VERDICTS = ["Strong match", "Decent match", "Partial match", "Weak match"];
const PASS_MARK = 55;
const TARGET = 75;
const DAY_MS = 86400000;
const RANGE_KEY = "shortlist.dashboardRange";

function readRange() {
  try {
    const raw = localStorage.getItem(RANGE_KEY);
    const saved = raw === null ? NaN : Number(raw);
    return RANGES.some((range) => range.id === saved) ? saved : 30;
  } catch {
    return 30;
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = useState({ isLoading: true, error: "", matches: null, dashboard: null });
  const [range, setRangeState] = useState(readRange);

  function setRange(next) {
    setRangeState(next);
    try {
      localStorage.setItem(RANGE_KEY, String(next));
    } catch {
      // not remembered, that's fine
    }
  }

  useEffect(() => {
    let isCurrent = true;
    Promise.all([listMatches(), getDashboard()])
      .then(([matches, dashboard]) => isCurrent && setState({ isLoading: false, error: "", matches, dashboard }))
      .catch((error) => isCurrent && setState({ isLoading: false, error: error.message, matches: null, dashboard: null }));
    return () => {
      isCurrent = false;
    };
  }, []);

  const model = useMemo(() => (state.matches ? buildModel(state.matches, range) : null), [state.matches, range]);

  if (state.isLoading) return <DashboardSkeleton />;
  if (state.error) return <PageMessage title="The dashboard could not be loaded" text={state.error} />;

  const firstName = user.name.split(" ")[0];
  if (state.matches.length === 0) return <FirstRun firstName={firstName} />;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const gaps = state.dashboard.top_missing_skills;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>{today}</p>
          <h1>
            {greeting()}, {firstName}
          </h1>
        </div>
        <div className={styles.headerActions}>
          <div className="segmented" role="group" aria-label="Date range">
            {RANGES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={range === option.id}
                onClick={() => setRange(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="buttonQuiet"
            onClick={() => exportMatchesCsv(model.current, "shortlist-dashboard.csv")}
            disabled={!model.current.length}
          >
            <Download size={15} aria-hidden="true" /> Export
          </button>
        </div>
      </header>

      <section className={styles.kpis} aria-label="Key numbers">
        {model.kpis.map((kpi) => (
          <Kpi key={kpi.label} {...kpi} range={range} />
        ))}
      </section>

      <div className={styles.rowWide}>
        <section className={`sheet ${styles.card}`}>
          <div className={styles.cardHead}>
            <div>
              <h2>Score trend</h2>
              <p className={styles.cardNote}>
                {model.current.length
                  ? `${model.current.length} analyses ${range ? `in the last ${range} days` : "in total"}`
                  : "No analyses in this period"}
              </p>
            </div>
            <div className={styles.legend}>
              <span>
                <i className={styles.legendLine} /> Score
              </span>
              <span>
                <i className={styles.legendDash} /> Average
              </span>
              <span>
                <i className={`${styles.legendDash} ${styles.legendTarget}`} /> Target {TARGET}
              </span>
            </div>
          </div>
          {model.trend.length ? (
            <TrendChart points={model.trend} average={model.average} />
          ) : (
            <EmptyChart text="Pick a longer range to see your trend." />
          )}
        </section>

        <section className={`sheet ${styles.card}`}>
          <div className={styles.cardHead}>
            <div>
              <h2>Match quality</h2>
              <p className={styles.cardNote}>Verdicts in this period</p>
            </div>
          </div>
          <QualityBreakdown verdicts={model.verdicts} total={model.current.length} />
        </section>
      </div>

      <div className={styles.rowWide}>
        <section className={`sheet ${styles.card} ${styles.flush}`}>
          <div className={`${styles.cardHead} ${styles.padded}`}>
            <div>
              <h2>Recent analyses</h2>
              <p className={styles.cardNote}>Your latest checks, newest first</p>
            </div>
            <Link to="/history" className={styles.cardLink}>
              View all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <RecentTable rows={state.matches.slice(0, 6)} />
        </section>

        <section className={`sheet ${styles.card}`}>
          <div className={styles.cardHead}>
            <div>
              <h2>Next steps</h2>
              <p className={styles.cardNote}>Suggested from your results</p>
            </div>
          </div>
          <NextSteps matches={state.matches} gaps={gaps} average={model.average} />
        </section>
      </div>

      <div className={styles.rowWide}>
        <section className={`sheet ${styles.card}`}>
          <div className={styles.cardHead}>
            <div>
              <h2>Activity</h2>
              <p className={styles.cardNote}>Analyses per day, last 26 weeks</p>
            </div>
          </div>
          <ActivityHeatmap dates={state.matches.map((match) => match.created_at)} weeks={26} />
        </section>

        <section className={`sheet ${styles.card}`}>
          <div className={styles.cardHead}>
            <div>
              <h2>Top skill gaps</h2>
              <p className={styles.cardNote}>Asked for, not on your resume</p>
            </div>
            <Link to="/skills" className={styles.cardLink}>
              Details <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {gaps.length ? <SkillGaps gaps={gaps} total={state.matches.length} /> : <p className="muted">No gaps found so far.</p>}
        </section>
      </div>
    </div>
  );
}

// ---------- pieces ----------

function Kpi({ label, value, unit, delta, deltaUnit = "", invert, spark, hint, range }) {
  const hasDelta = range !== 0 && delta != null && Number.isFinite(delta);
  const positive = invert ? delta < 0 : delta > 0;
  const flat = hasDelta && Math.round(delta) === 0;
  return (
    <div className={`sheet ${styles.kpi}`}>
      <p className={styles.kpiLabel}>{label}</p>
      <div className={styles.kpiBody}>
        <p className={styles.kpiValue}>
          {value}
          {unit && <span className={styles.kpiUnit}>{unit}</span>}
        </p>
        <Sparkline values={spark} />
      </div>
      <p className={styles.kpiFoot}>
        {hasDelta ? (
          <>
            <span className={`${styles.delta} ${flat ? styles.deltaFlat : positive ? styles.deltaUp : styles.deltaDown}`}>
              {!flat && (delta > 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />)}
              {delta > 0 ? "+" : ""}
              {Math.round(delta)}
              {deltaUnit}
            </span>
            <span>vs previous {range} days</span>
          </>
        ) : (
          <span>{hint}</span>
        )}
      </p>
    </div>
  );
}

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{point.job_title}</p>
      <p>
        {formatShortDate(point.created_at)} · <strong>{Math.round(point.overall_score)}</strong> / 100
      </p>
    </div>
  );
}

function TrendChart({ points, average }) {
  const navigate = useNavigate();
  const data = points.map((point, index) => ({ ...point, index }));
  const tick = { fontSize: 11, fill: "var(--ink-faint)" };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
        onClick={(event) => {
          const point = event?.activePayload?.[0]?.payload;
          if (point) navigate(`/results/${point.id}`);
        }}
      >
        <defs>
          <linearGradient id="dashTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="index"
          tickFormatter={(index) => formatShortDate(data[index].created_at)}
          tickLine={false}
          axisLine={false}
          tick={tick}
          minTickGap={24}
          padding={{ left: 8, right: 8 }}
        />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} tick={tick} />
        <ReferenceLine y={TARGET} stroke="var(--good)" strokeDasharray="4 4" strokeOpacity={0.7} />
        <ReferenceLine y={average} stroke="var(--ink-faint)" strokeDasharray="2 4" />
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
        <Area
          type="monotone"
          dataKey="overall_score"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#dashTrendFill)"
          dot={{ r: 3, fill: "var(--paper)", stroke: "var(--accent)", strokeWidth: 1.6 }}
          activeDot={{ r: 5, fill: "var(--accent)", stroke: "var(--paper)", strokeWidth: 2, cursor: "pointer" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function QualityBreakdown({ verdicts, total }) {
  if (!total) return <EmptyChart text="No analyses in this period." small />;
  return (
    <div className={styles.quality}>
      <div className={styles.qualityTop}>
        <p className={styles.qualityValue}>
          {verdicts[0].percent + verdicts[1].percent}%
        </p>
        <p className={styles.cardNote}>scored Decent or better</p>
      </div>
      <div className={styles.stack} role="img" aria-label="Verdict split">
        {verdicts
          .filter((item) => item.count)
          .map((item) => (
            <span key={item.verdict} style={{ flexGrow: item.count, background: COLOURS[item.verdict] }} />
          ))}
      </div>
      <ul className={styles.qualityList}>
        {verdicts.map((item) => (
          <li key={item.verdict}>
            <span className={styles.qualityDot} style={{ background: COLOURS[item.verdict] }} />
            <span className={styles.qualityLabel}>{item.verdict}</span>
            <span className={styles.qualityCount}>{item.count}</span>
            <span className={styles.qualityPct}>{item.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentTable({ rows }) {
  const navigate = useNavigate();
  return (
    <div className="tableScroll">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Job</th>
            <th>Verdict</th>
            <th>Score</th>
            <th className={styles.right}>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((match) => {
            return (
              <tr key={match.id} onClick={() => navigate(`/results/${match.id}`)}>
                <td>
                  <Link to={`/results/${match.id}`} className={styles.jobLink} onClick={(event) => event.stopPropagation()}>
                    {match.job_title}
                  </Link>
                  {match.resume_name !== "Pasted text" && <span className={styles.jobSub}>{match.resume_name}</span>}
                </td>
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
                <td className={`${styles.right} ${styles.when}`}>{timeAgo(match.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NextSteps({ matches, gaps, average }) {
  const steps = [];
  if (gaps[0]) {
    steps.push({
      icon: Wrench,
      tone: "bad",
      title: `Add ${gaps[0].skill} to your resume`,
      text: `Asked for in ${gaps[0].count} of your ${matches.length} jobs but never found.`,
      to: "/skills",
    });
  }
  const weakest = [...matches].sort((a, b) => a.overall_score - b.overall_score)[0];
  if (weakest && weakest.overall_score < PASS_MARK) {
    steps.push({
      icon: Target,
      tone: "okay",
      title: `Revisit “${weakest.job_title}”`,
      text: `Your lowest score (${Math.round(weakest.overall_score)}). Check which requirements were missed.`,
      to: `/results/${weakest.id}`,
    });
  }
  if (average < TARGET) {
    steps.push({
      icon: TrendingUp,
      tone: "accent",
      title: `${Math.round(TARGET - average)} points to your target`,
      text: `Average is ${Math.round(average)}; ${TARGET}+ is a strong match. Re-run after edits and compare.`,
      to: "/compare",
    });
  } else {
    steps.push({
      icon: Lightbulb,
      tone: "good",
      title: "You're above target",
      text: "Your average is a strong match. Try ranking against other candidates.",
      to: "/rank",
    });
  }

  return (
    <ul className={styles.steps}>
      {steps.map(({ icon: Icon, tone, title, text, to }) => (
        <li key={title}>
          <Link to={to} className={styles.step}>
            <span className={`${styles.stepIcon} ${styles[`tone_${tone}`]}`}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className={styles.stepText}>
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
            <ArrowRight size={15} className={styles.stepArrow} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SkillGaps({ gaps, total }) {
  return (
    <ul className={styles.gaps}>
      {gaps.map((gap) => {
        const pct = Math.round((100 * gap.count) / total);
        return (
          <li key={gap.skill}>
            <span className={styles.gapName}>{gap.skill}</span>
            <span className={styles.gapBar}>
              <span style={{ width: `${Math.max(pct, 4)}%` }} />
            </span>
            <span className={styles.gapPct}>{pct}%</span>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyChart({ text, small }) {
  return <div className={`${styles.emptyChart} ${small ? styles.emptySmall : ""}`}>{text}</div>;
}

/** Shown to a user who has not run any analysis yet. */
function FirstRun({ firstName }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>Welcome to Shortlist</p>
          <h1>
            {greeting()}, {firstName}
          </h1>
        </div>
      </header>

      <div className={styles.firstRun}>
        <Link to="/analyze" className={`sheet ${styles.startCard}`}>
          <span className={styles.startIcon}>
            <FileSearch size={20} aria-hidden="true" />
          </span>
          <h2>Analyse a resume</h2>
          <p className="muted">
            Upload a resume and paste a job description. Each requirement is marked as covered, loosely
            covered or missing.
          </p>
          <span className={styles.startAction}>
            Start an analysis <ArrowRight size={15} aria-hidden="true" />
          </span>
        </Link>

        <Link to="/rank" className={`sheet ${styles.startCard}`}>
          <span className={styles.startIcon}>
            <ListOrdered size={20} aria-hidden="true" />
          </span>
          <h2>Rank several resumes</h2>
          <p className="muted">Have up to ten resumes for one job? Upload them together and see them ordered by fit.</p>
          <span className={styles.startAction}>
            Rank resumes <ArrowRight size={15} aria-hidden="true" />
          </span>
        </Link>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.page} role="status" aria-label="Loading dashboard">
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={styles.kpis}>
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={`${styles.skeleton} ${styles.skeletonStat}`} />
        ))}
      </div>
      <div className={styles.rowWide}>
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      </div>
    </div>
  );
}

// ---------- numbers ----------

function inWindow(matches, fromMs, toMs) {
  return matches.filter((match) => {
    const t = new Date(match.created_at).getTime();
    return t >= fromMs && t < toMs;
  });
}

function summarise(rows) {
  const scores = rows.map((row) => row.overall_score);
  const count = scores.length;
  return {
    count,
    average: count ? scores.reduce((sum, value) => sum + value, 0) / count : null,
    passRate: count ? (100 * scores.filter((score) => score >= PASS_MARK).length) / count : null,
    best: count ? Math.max(...scores) : null,
  };
}

function diff(current, previous) {
  return current == null || previous == null ? null : current - previous;
}

function buildModel(matches, range) {
  const now = Date.now();
  const current = range ? inWindow(matches, now - range * DAY_MS, now + 1) : matches;
  const previous = range ? inWindow(matches, now - 2 * range * DAY_MS, now - range * DAY_MS) : [];

  const cur = summarise(current);
  const prev = summarise(previous);

  const oldestFirst = [...current].reverse();
  const scoreSeries = oldestFirst.map((row) => row.overall_score);
  const runningPass = oldestFirst.map(
    (_, index, all) => (100 * all.slice(0, index + 1).filter((row) => row.overall_score >= PASS_MARK).length) / (index + 1)
  );
  const runningBest = scoreSeries.map((_, index) => Math.max(...scoreSeries.slice(0, index + 1)));

  // analyses per bucket, for the count sparkline
  const buckets = 8;
  const span = range ? range * DAY_MS : Math.max(now - new Date(matches[matches.length - 1].created_at).getTime(), DAY_MS);
  const counts = Array.from({ length: buckets }, (_, index) => {
    const from = now - span + (index * span) / buckets;
    return inWindow(current, from, from + span / buckets).length;
  });

  const kpis = [
    {
      label: "Analyses",
      value: cur.count,
      delta: range ? cur.count - prev.count : null,
      spark: counts,
      hint: "All time",
    },
    {
      label: "Average score",
      value: cur.average == null ? "–" : Math.round(cur.average),
      unit: cur.average == null ? "" : "/100",
      delta: diff(cur.average, prev.average),
      deltaUnit: " pts",
      spark: scoreSeries,
      hint: "Across every analysis",
    },
    {
      label: "Pass rate",
      value: cur.passRate == null ? "–" : Math.round(cur.passRate),
      unit: cur.passRate == null ? "" : "%",
      delta: diff(cur.passRate, prev.passRate),
      deltaUnit: " pts",
      spark: runningPass,
      hint: `Scored ${PASS_MARK} or more`,
    },
    {
      label: "Best score",
      value: cur.best == null ? "–" : Math.round(cur.best),
      unit: cur.best == null ? "" : "/100",
      delta: diff(cur.best, prev.best),
      deltaUnit: " pts",
      spark: runningBest,
      hint: "Your strongest match",
    },
  ];

  const verdicts = VERDICTS.map((verdict) => {
    const count = current.filter((row) => row.verdict === verdict).length;
    return { verdict, count, percent: current.length ? Math.round((100 * count) / current.length) : 0 };
  });

  return {
    current,
    kpis,
    trend: oldestFirst.slice(-30),
    average: cur.average ?? 0,
    verdicts,
  };
}
