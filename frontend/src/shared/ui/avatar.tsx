import { cx } from "@/shared/lib";
import styles from "./ui.module.css";

type AvatarProps = {
  initials: string;
  color?: "violet" | "peach" | "mint" | "neutral";
  size?: "small" | "large";
};

export function Avatar({ initials, color = "neutral", size }: AvatarProps) {
  return (
    <span className={cx(styles.avatar, styles[color], size && styles[size])}>
      {initials}
    </span>
  );
}
