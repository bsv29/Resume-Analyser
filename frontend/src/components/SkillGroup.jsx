import styles from "./SkillGroup.module.css";

// tone: "matched" | "missing" | "extra"
export default function SkillGroup({ title, skills, tone, emptyText }) {
  return (
    <div className={styles.group}>
      <h3 className={styles.title}>
        {title} <span className={styles.count}>{skills.length}</span>
      </h3>

      {skills.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {skills.map((skill) => (
            <li key={skill} className={`${styles.skill} ${styles[tone]}`}>
              {skill}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
