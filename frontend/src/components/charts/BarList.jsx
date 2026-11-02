import "./charts.css";

// Ranked horizontal bars with the value at each bar's tip
function BarList({ data, formatValue }) {
  if (!data.length) return <p className="chart-empty">No data for this period.</p>;
  const max = Math.max(...data.map((d) => d.value));

  return (
    <ol className="bar-list">
      {data.map((d) => (
        <li key={d.key} className="bar-row" title={`${d.label}: ${formatValue(d.value)}${d.hint ? ` (${d.hint})` : ""}`}>
          <span className="bar-label">
            {d.label}
            {d.hint && <small>{d.hint}</small>}
          </span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }} />
            <span className="bar-value">{formatValue(d.value)}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default BarList;
