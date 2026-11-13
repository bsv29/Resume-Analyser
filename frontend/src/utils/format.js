export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// "high" | "medium" | "low" - used to pick the colour of a score.
export function scoreLevel(score) {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

export function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/** Builds a CSV file from rows and makes the browser download it. */
export function downloadCsv(filename, header, rows) {
  const escape = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** History rows as CSV: one line per saved analysis. */
export function exportMatchesCsv(matches, filename = "shortlist-analyses.csv") {
  downloadCsv(
    filename,
    ["Job", "Resume", "Verdict", "Score", "Date"],
    matches.map((m) => [m.job_title, m.resume_name, m.verdict, Math.round(m.overall_score), m.created_at])
  );
}

/** "just now", "3h ago", "2d ago", or a date for anything older than a month. */
export function timeAgo(isoString) {
  const seconds = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return formatDate(isoString);
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
