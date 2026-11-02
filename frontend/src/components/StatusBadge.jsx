import { STATUS_LABELS } from "../utils/format";

const ICONS = { delivered: "✓", cancelled: "✕", pending: "•", confirmed: "✓", preparing: "◔", out_for_delivery: "➜" };

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${status}`}>
      <span aria-hidden="true">{ICONS[status]}</span>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default StatusBadge;
