import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatShortDate } from "../../utils/format.js";
import styles from "./charts.module.css";

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>{point.job_title}</p>
      <p>
        {formatShortDate(point.created_at)}, score {Math.round(point.overall_score)}
      </p>
    </div>
  );
}

/** Area chart of the user's latest scores, oldest on the left. */
export default function ScoreTrendChart({ points }) {
  // recharts needs a unique x value per point; two checks can share a date
  const data = points.map((point, index) => ({ ...point, index }));

  // Print a date under a point only when it differs from the point before,
  // so five analyses on one day do not repeat the same label five times.
  function dateLabel(index) {
    const current = formatShortDate(data[index].created_at);
    const previous = index > 0 ? formatShortDate(data[index - 1].created_at) : "";
    return current === previous ? "" : current;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" vertical={false} />
        <XAxis
          dataKey="index"
          tickFormatter={dateLabel}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--ink-faint)" }}
          interval={0}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--ink-faint)" }}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--line-strong)" }} />
        <Area
          type="monotone"
          dataKey="overall_score"
          stroke="var(--accent)"
          strokeWidth={2.5}
          fill="url(#scoreFill)"
          dot={{ r: 3.5, fill: "var(--paper)", stroke: "var(--accent)", strokeWidth: 2 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
