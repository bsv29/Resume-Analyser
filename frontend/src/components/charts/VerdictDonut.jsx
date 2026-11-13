import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import styles from "./charts.module.css";

export const COLOURS = {
  "Strong match": "var(--good)",
  "Decent match": "var(--accent)",
  "Partial match": "var(--amber-mark)",
  "Weak match": "var(--bad)",
};

/** Donut showing how many analyses ended in each verdict. */
export default function VerdictDonut({ breakdown }) {
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);
  const slices = breakdown.filter((item) => item.count > 0);

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="verdict"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={slices.length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((item) => (
                <Cell key={item.verdict} fill={COLOURS[item.verdict]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCentre}>
          <span className={styles.donutTotal}>{total}</span>
          <span className={styles.donutCaption}>analyses</span>
        </div>
      </div>

      <ul className={styles.legend}>
        {breakdown.map((item) => (
          <li key={item.verdict}>
            <span className={styles.dot} style={{ background: COLOURS[item.verdict] }} />
            <span className={styles.legendLabel}>{item.verdict}</span>
            <span className={styles.legendCount}>{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
