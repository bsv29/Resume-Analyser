import { BrainCircuit, FileText, Gauge, ListChecks, Scissors, Tags } from "lucide-react";
import { Link } from "react-router-dom";

import styles from "./HelpPage.module.css";

const STEPS = [
  { icon: Scissors, title: "Split", text: "The resume and the job description are cut into short lines." },
  { icon: BrainCircuit, title: "Embed", text: "Each line becomes a 384-number vector with a MiniLM sentence model." },
  { icon: ListChecks, title: "Match", text: "Every job line is paired with the resume line closest in meaning." },
  { icon: Tags, title: "Skills", text: "Named skills are found in both documents from a skills dictionary." },
  { icon: Gauge, title: "Score", text: "Final score = 60% meaning score + 40% skill score." },
];

const MARKS = [
  { label: "Covered", text: "Similarity 0.55 or above. The resume clearly talks about it.", chip: "chipGood" },
  { label: "Loosely covered", text: "0.40 to 0.55. The resume mentions something related.", chip: "chipOkay" },
  { label: "Missing", text: "Below 0.40. Nothing in the resume is close.", chip: "chipBad" },
];

const FAQ = [
  {
    q: "Why was my PDF rejected?",
    a: "Scanned PDFs are images with no text inside. Export the resume from Word or Google Docs as a PDF, or paste the text instead.",
  },
  {
    q: "A skill I have shows as missing. Why?",
    a: "Skills are found by name. Write the skill the way the job writes it (for example \"PostgreSQL\" rather than \"Postgres DB\"). Only skills in the built-in dictionary are recognised.",
  },
  {
    q: "Two-column resume lines look mixed up",
    a: "PDF text from two-column layouts can come out in mixed order. A single-column resume gives the most accurate match.",
  },
  {
    q: "How many resumes can I rank at once?",
    a: "Between 2 and 10 PDF resumes per job description on the Rank resumes page.",
  },
  {
    q: "Who can see my analyses?",
    a: "Only you. Every saved analysis belongs to your account and every query filters by your user.",
  },
];

export default function HelpPage() {
  return (
    <div className="pageStack">
      <section className={styles.hero}>
        <span className={styles.heroEyebrow}>Help & guide</span>
        <h1>How Shortlist scores a resume</h1>
        <p>A plain-language tour of what happens between upload and score, and tips for a better match.</p>
        <div className={styles.heroActions}>
          <Link to="/analyze" className={styles.heroButton}>
            <FileText size={16} aria-hidden="true" /> Try an analysis
          </Link>
        </div>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>The five steps</h2>
        <ol className={styles.steps}>
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="sheet">
              <span className={styles.stepIcon}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className={styles.stepNo}>Step {index + 1}</span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid2">
        <section className="sheet card">
          <div className="cardHead">
            <h2>What the highlights mean</h2>
          </div>
          <ul className={styles.marks}>
            {MARKS.map((mark) => (
              <li key={mark.label}>
                <span className={`chip ${mark.chip}`}>{mark.label}</span>
                <span className="muted">{mark.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="sheet card">
          <div className="cardHead">
            <h2>Tips for a higher score</h2>
          </div>
          <ul className={styles.tips}>
            <li>Mirror the job's wording for skills and tools you really have.</li>
            <li>One achievement per bullet. Short lines match more precisely.</li>
            <li>Check <Link to="/skills">Skills insights</Link> for skills you keep missing.</li>
            <li>Re-run after editing and use <Link to="/compare">Compare</Link> to see the change.</li>
          </ul>
        </section>
      </div>

      <section className="sheet card">
        <div className="cardHead">
          <h2>Frequently asked questions</h2>
        </div>
        <div className={styles.faq}>
          {FAQ.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p className="muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
