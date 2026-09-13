import { cx } from "@/shared/lib";
import { ui } from "@/shared/ui";
import { STATUS, type Status } from "../model";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cx(ui.badge, ui[status])}>
      <span className={ui.badgeDot} />
      {STATUS[status].short}
    </span>
  );
}
