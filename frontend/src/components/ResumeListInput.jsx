import { useRef, useState } from "react";

import styles from "./ResumeListInput.module.css";

const MAX_SIZE_MB = 5;

/** Lets the user build a list of PDF resumes (pick or drop, several at once). */
export default function ResumeListInput({ files, onChange, maxFiles }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  function addFiles(fileList) {
    const incoming = Array.from(fileList);
    const existingNames = new Set(files.map((file) => file.name));
    const accepted = [];
    let problem = "";

    for (const file of incoming) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        problem = `${file.name} is not a PDF.`;
      } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        problem = `${file.name} is larger than ${MAX_SIZE_MB} MB.`;
      } else if (existingNames.has(file.name)) {
        problem = `${file.name} is already in the list.`;
      } else {
        existingNames.add(file.name);
        accepted.push(file);
      }
    }

    const combined = [...files, ...accepted];
    if (combined.length > maxFiles) {
      problem = `Only the first ${maxFiles} resumes were kept.`;
    }

    setError(problem);
    onChange(combined.slice(0, maxFiles));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(name) {
    setError("");
    onChange(files.filter((file) => file.name !== name));
  }

  return (
    <div>
      <label
        className={`${styles.dropArea} ${isDragging ? styles.dragging : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="visuallyHidden"
          onChange={(event) => addFiles(event.target.files)}
        />
        <span className={styles.prompt}>Drop resume PDFs here, or choose files</span>
        <span className="muted">
          2 to {maxFiles} files, up to {MAX_SIZE_MB} MB each
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className={styles.list}>
          {files.map((file) => (
            <li key={file.name} className={styles.item}>
              <span className={styles.name}>{file.name}</span>
              <button
                type="button"
                className="buttonQuiet"
                onClick={() => removeFile(file.name)}
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
