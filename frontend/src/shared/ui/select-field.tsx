import styles from "./ui.module.css";

type Option = { value: string; label: string };

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <label className={styles.formField}>
      {label}
      <select
        value={value}
        aria-label={label}
        disabled={options.length === 0}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.length === 0 && <option value="">Нет доступных вариантов</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
