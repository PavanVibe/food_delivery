import { useState } from "react";
import "./charts.css";

const W = 640;
const H = 240;
const PAD = { top: 16, right: 56, bottom: 28, left: 52 };

const niceMax = (value) => {
  if (value <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step) * step;
};

// Single-series area/line chart with crosshair tooltip and keyboard support
function LineChart({ data, label, formatValue, formatAxis = formatValue, formatX }) {
  const [active, setActive] = useState(null);
  if (!data.length) return <p className="chart-empty">No data for this period.</p>;

  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v) => PAD.top + plotH - (v / max) * plotH;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const last = data.length - 1;

  const pointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const index = Math.round(((px - PAD.left) / plotW) * last);
    setActive(Math.min(last, Math.max(0, index)));
  };

  const keyDown = (event) => {
    if (event.key === "ArrowRight") setActive((i) => Math.min(last, (i ?? -1) + 1));
    if (event.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? last + 1) - 1));
  };

  const point = active !== null ? data[active] : null;

  return (
    <div className="chart-frame">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={pointerMove}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(last)}
        onBlur={() => setActive(null)}
        onKeyDown={keyDown}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-gridline" />
            <text x={PAD.left - 8} y={y(t)} className="chart-axis" textAnchor="end" dominantBaseline="middle">
              {formatAxis(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === last ? (
            <text key={d.x} x={x(i)} y={H - 8} className="chart-axis" textAnchor="middle">
              {formatX(d.x)}
            </text>
          ) : null
        )}

        <path d={area} className="chart-area" />
        <path d={line} className="chart-line" />

        <circle cx={x(last)} cy={y(data[last].value)} r={4} className="chart-dot" />
        <text x={x(last) + 8} y={y(data[last].value)} className="chart-end-label" dominantBaseline="middle">
          {formatAxis(data[last].value)}
        </text>

        {point && (
          <g pointerEvents="none">
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} className="chart-crosshair" />
            <circle cx={x(active)} cy={y(point.value)} r={4} className="chart-dot" />
          </g>
        )}
      </svg>

      {point && (
        <div className="chart-tooltip" style={{ left: `${(x(active) / W) * 100}%` }}>
          <strong>{formatValue(point.value)}</strong>
          <span>{formatX(point.x)}</span>
          {point.extra && <span>{point.extra}</span>}
        </div>
      )}
    </div>
  );
}

export default LineChart;
