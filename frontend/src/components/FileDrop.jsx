import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import styles from "./FileDrop.module.css";

const MAX_SIZE_MB = 5;

export default function FileDrop({ file, onChange }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  function selectFile(selected) {
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is larger than ${MAX_SIZE_MB} MB.`);
      return;
    }
    setError("");
    onChange(selected);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  function handleRemove() {
    onChange(null);
    // reset the input so choosing the same file again still fires onChange
    if (inputRef.current) inputRef.current.value = "";
  }

  if (file) {
    return (
      <div className={styles.selected}>
        <div>
          <p className={styles.fileName}>{file.name}</p>
          <p className="muted">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button type="button" className="buttonQuiet" onClick={handleRemove}>
          Remove
        </button>
      </div>
    );
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
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="visuallyHidden"
          onChange={(event) => selectFile(event.target.files[0])}
        />
        <span className={styles.uploadIcon}>
          <UploadCloud size={20} aria-hidden="true" />
        </span>
        <span className={styles.prompt}>
          Drop the resume PDF here, or <span className={styles.browse}>choose a file</span>
        </span>
        <span className="muted">PDF with selectable text, up to {MAX_SIZE_MB} MB</span>
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
