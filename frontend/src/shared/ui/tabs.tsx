import { cx } from "@/shared/lib";
import styles from "./ui.module.css";

type Tab = { value: string; label: string; count?: number };

export function Tabs({
  value,
  onChange,
  tabs,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  tabs: Tab[];
  compact?: boolean;
}) {
  return (
    <div className={cx(styles.tabs, compact && styles.compactTabs)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={cx(styles.tab, value === tab.value && styles.tabActive)}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
