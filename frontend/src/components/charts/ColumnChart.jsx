import { useState } from "react";
import "./charts.css";

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };
const R = 4;

// Column with a 4px rounded top and a square base
const columnPath = (x, y, w, h) => {
  const r = Math.min(R, h, w / 2);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
};

function ColumnChart({ data, label, formatValue, formatX }) {
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.min(24, band - 2);
  const y = (v) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.5, 1].map((t) => Math.round(t * max));
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-gridline" />
            <text x={PAD.left - 8} y={y(t)} className="chart-axis" textAnchor="end" dominantBaseline="middle">
              {formatValue(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + band * i + band / 2;
          const h = (d.value / max) * plotH;
          return (
            <g
              key={d.x}
              tabIndex={0}
              className={`chart-col ${active === i ? "is-active" : ""}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${formatX(d.x)}: ${formatValue(d.value)}`}
            >
              <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} className="chart-hit" />
              {h > 0 && <path d={columnPath(cx - barW / 2, y(d.value), barW, h)} className="chart-bar" />}
              {i % 4 === 0 && (
                <text x={cx} y={H - 8} className="chart-axis" textAnchor="middle">
                  {formatX(d.x)}
                </text>
              )}
            </g>
          );
        })}
        {data[peak]?.value > 0 && active === null && (
          <text x={PAD.left + band * peak + band / 2} y={y(data[peak].value) - 6} className="chart-end-label" textAnchor="middle">
            {formatValue(data[peak].value)}
          </text>
        )}
      </svg>

      {active !== null && (
        <div className="chart-tooltip" style={{ left: `${((PAD.left + band * active + band / 2) / W) * 100}%` }}>
          <strong>{formatValue(data[active].value)}</strong>
          <span>{formatX(data[active].x)}</span>
        </div>
      )}
    </div>
  );
}

export default ColumnChart;
