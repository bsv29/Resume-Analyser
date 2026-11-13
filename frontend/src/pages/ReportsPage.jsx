import { CheckCircle2, Download, FileSearch, Gauge, Printer, Sigma } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { listMatches } from "../api/client.js";
import { COLOURS } from "../components/charts/VerdictDonut.jsx";
import PageMessage from "../components/ui/PageMessage.jsx";
import ScoreBadge from "../components/ui/ScoreBadge.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import useApi from "../hooks/useApi.js";
import { exportMatchesCsv, formatDate, formatShortDate } from "../utils/format.js";
import styles from "./ReportsPage.module.css";

const RANGES = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
  { id: 0, label: "All time" },
];
const VERDICTS = ["Strong match", "Decent match", "Partial match", "Weak match"];
const PASS_MARK = 55; // "Decent match" or better

const axisTick = { fontSize: 12, fill: "var(--ink-faint)" };

export default function ReportsPage() {
  const { data: matches, error, isLoading } = useApi(listMatches);
  const [range, setRange] = useState(30);

  const report = useMemo(() => (matches ? buildReport(matches, range) : null), [matches, range]);

  if (isLoading) return <PageMessage title="Building your report…" />;
  if (error) return <PageMessage title="The report could not be built" text={error} />;

  if (matches.length === 0) {
    return (
      <div className="sheet emptyCard">
        <span className="eyebrow">Reports</span>
        <h1>Nothing to report yet</h1>
        <p className="muted">Reports summarise your analyses over time. Run one to get started.</p>
        <Link to="/analyze" className="button">
          Run an analysis
        </Link>
      </div>
    );
  }

  const { rows, stats, buckets, activity, verdicts, top, bottom } = report;

  return (
    <div className="pageStack">
      <div className="pageHead">
        <div>
          <span className="eyebrow">Insights</span>
          <h1>Reports</h1>
          <p>
            {rows.length} {rows.length === 1 ? "analysis" : "analyses"} in{" "}
            {range ? `the last ${range} days` : "total"}.
          </p>
        </div>
        <div className={`${styles.actions} noPrint`}>
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
            onClick={() => exportMatchesCsv(rows, `shortlist-report-${range || "all"}.csv`)}
            disabled={!rows.length}
          >
            <Download size={15} aria-hidden="true" /> CSV
          </button>
          <button type="button" className="buttonQuiet" onClick={() => window.print()}>
            <Printer size={15} aria-hidden="true" /> Print
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="sheet emptyCard">
          <h2>No analyses in this period</h2>
          <p className="muted">Pick a longer range to see your report.</p>
        </div>
      ) : (
        <>
          <div className="grid4">
            <StatCard icon={FileSearch} label="Analyses" value={rows.length} hint="In this period" />
            <StatCard icon={Gauge} tone="amber" label="Average score" value={stats.average} hint="Out of 100" />
            <StatCard icon={Sigma} tone="slate" label="Median score" value={stats.median} hint="Half scored above" />
            <StatCard
              icon={CheckCircle2}
              tone="green"
              label="Pass rate"
              value={`${stats.passRate}%`}
              hint={`Scored ${PASS_MARK} or more`}
            />
          </div>

          <div className="grid2">
            <section className="sheet card">
              <div className="cardHead">
                <div>
                  <h2>Score distribution</h2>
                  <p className="cardNote">How many analyses landed in each score band</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={buckets} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
                  <Tooltip content={<CountTooltip unit="analyses" />} cursor={{ fill: "var(--slate-tint)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {buckets.map((bucket) => (
                      <Cell key={bucket.label} fill={bucket.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="sheet card">
              <div className="cardHead">
                <div>
                  <h2>Activity</h2>
                  <p className="cardNote">Analyses per {activity.unit}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={activity.points} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} minTickGap={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={axisTick} />
                  <Tooltip content={<CountTooltip unit="analyses" />} cursor={{ fill: "var(--slate-tint)" }} />
                  <Bar dataKey="count" fill="var(--violet)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <div className={styles.lower}>
            <section className="sheet card">
              <div className="cardHead">
                <h2>Results by verdict</h2>
              </div>
              <ul className={styles.verdicts}>
                {verdicts.map((item) => (
                  <li key={item.verdict}>
                    <div className={styles.verdictHead}>
                      <span>
                        <span className={styles.dot} style={{ background: COLOURS[item.verdict] }} />
                        {item.verdict}
                      </span>
                      <span className="muted">
                        {item.count} · {item.percent}%
                      </span>
                    </div>
                    <div className="meter">
                      <span style={{ width: `${item.percent}%`, background: COLOURS[item.verdict] }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="sheet card">
              <div className="cardHead">
                <h2>Best matches</h2>
              </div>
              <RankedList rows={top} />
            </section>

            <section className="sheet card">
              <div className="cardHead">
                <h2>Needs work</h2>
              </div>
              <RankedList rows={bottom} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function RankedList({ rows }) {
  return (
    <ol className={styles.ranked}>
      {rows.map((match) => (
        <li key={match.id}>
          <div className={styles.rankedText}>
            <Link to={`/results/${match.id}`}>{match.job_title}</Link>
            <span>
              {match.resume_name} · {formatDate(match.created_at)}
            </span>
          </div>
          <ScoreBadge score={match.overall_score} />
        </li>
      ))}
    </ol>
  );
}

function CountTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <strong>{point.label}</strong>: {point.count} {unit}
    </div>
  );
}

// ---------- numbers ----------

function buildReport(matches, rangeDays) {
  const since = rangeDays ? Date.now() - rangeDays * 86400000 : 0;
  const rows = matches.filter((m) => new Date(m.created_at).getTime() >= since);
  const scores = rows.map((m) => m.overall_score).sort((a, b) => a - b);

  const mid = Math.floor(scores.length / 2);
  const median = scores.length
    ? scores.length % 2
      ? scores[mid]
      : (scores[mid - 1] + scores[mid]) / 2
    : 0;

  const stats = {
    average: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
    median: Math.round(median),
    passRate: scores.length ? Math.round((100 * scores.filter((s) => s >= PASS_MARK).length) / scores.length) : 0,
  };

  const buckets = [0, 20, 40, 60, 80].map((low) => ({
    label: `${low}-${low === 80 ? 100 : low + 19}`,
    count: scores.filter((s) => s >= low && (low === 80 ? s <= 100 : s < low + 20)).length,
    color: low >= 80 ? "var(--good)" : low >= 60 ? "var(--accent)" : low >= 40 ? "var(--amber-mark)" : "var(--bad)",
  }));

  const verdicts = VERDICTS.map((verdict) => {
    const count = rows.filter((m) => m.verdict === verdict).length;
    return { verdict, count, percent: rows.length ? Math.round((100 * count) / rows.length) : 0 };
  });

  const byScore = [...rows].sort((a, b) => b.overall_score - a.overall_score);

  return {
    rows,
    stats,
    buckets,
    activity: buildActivity(rows, rangeDays),
    verdicts,
    top: byScore.slice(0, 5),
    bottom: byScore.slice(-5).reverse(),
  };
}

// Daily bars for short ranges, weekly bars otherwise.
function buildActivity(rows, rangeDays) {
  const daily = rangeDays && rangeDays <= 30;
  const dayMs = 86400000;
  const step = daily ? dayMs : 7 * dayMs;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oldest = rows.length ? Math.min(...rows.map((m) => new Date(m.created_at).getTime())) : today.getTime();
  const start = rangeDays ? today.getTime() - (rangeDays - 1) * dayMs : oldest;
  const slots = Math.max(1, Math.min(60, Math.floor((today.getTime() - start) / step) + 1));

  const points = Array.from({ length: slots }, (_, i) => {
    const from = today.getTime() - (slots - 1 - i) * step;
    return { from, label: formatShortDate(new Date(from).toISOString()), count: 0 };
  });

  rows.forEach((m) => {
    const t = new Date(m.created_at).getTime();
    for (let i = points.length - 1; i >= 0; i -= 1) {
      if (t >= points[i].from) {
        if (t < points[i].from + step) points[i].count += 1;
        break;
      }
    }
  });

  return { unit: daily ? "day" : "week", points };
}
