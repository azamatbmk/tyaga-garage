import styles from "./ui.module.css";

export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <span
      className={styles.progress}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className={styles.progressBar} style={{ width: `${value}%` }} />
    </span>
  );
}
