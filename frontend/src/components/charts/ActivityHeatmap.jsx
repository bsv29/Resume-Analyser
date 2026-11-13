import styles from "./ActivityHeatmap.module.css";

const DAY_MS = 86400000;
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

/**
 * Calendar grid of the last `weeks` weeks, one cell per day, darker when
 * more analyses were run that day. Columns are weeks (oldest on the left).
 */
export default function ActivityHeatmap({ dates, weeks = 18 }) {
  const counts = new Map();
  dates.forEach((iso) => {
    const key = dayKey(new Date(iso));
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Monday of the current week
  const monday = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY_MS);
  const start = new Date(monday.getTime() - (weeks - 1) * 7 * DAY_MS);

  const columns = [];
  const monthLabels = [];
  for (let w = 0; w < weeks; w += 1) {
    const cells = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
      const future = date > today;
      const count = counts.get(dayKey(date)) || 0;
      cells.push({ date, count, future });
    }
    const first = cells[0].date;
    const previous = w > 0 ? columns[w - 1][0].date : null;
    monthLabels.push(!previous || first.getMonth() !== previous.getMonth() ? first.toLocaleDateString("en-IN", { month: "short" }) : "");
    columns.push(cells);
  }

  const total = dates.filter((iso) => new Date(iso) >= start).length;
  const activeDays = columns.flat().filter((cell) => cell.count > 0).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        <div className={styles.dayLabels}>
          <span />
          {DAY_LABELS.map((label, index) => (
            <span key={index}>{label}</span>
          ))}
        </div>
        {columns.map((cells, w) => (
          <div key={w} className={styles.column}>
            <span className={styles.month}>{monthLabels[w]}</span>
            {cells.map((cell) => (
              <span
                key={cell.date.toISOString()}
                className={`${styles.cell} ${cell.future ? styles.future : ""}`}
                data-level={Math.min(cell.count, 3)}
                title={
                  cell.future
                    ? ""
                    : `${cell.count || "No"} ${cell.count === 1 ? "analysis" : "analyses"} on ${cell.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span>
          <strong>{total}</strong> analyses on <strong>{activeDays}</strong> days
        </span>
        <span className={styles.legend}>
          Less
          {[0, 1, 2, 3].map((level) => (
            <span key={level} className={styles.cell} data-level={level} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
