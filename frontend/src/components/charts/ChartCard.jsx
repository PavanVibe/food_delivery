import "./charts.css";

// Chart panel with a data-table twin for accessibility
function ChartCard({ title, subtitle, columns, rows, children }) {
  return (
    <section className="chart-card card">
      <header className="chart-card-header">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
      {rows?.length > 0 && (
        <details className="chart-table">
          <summary>View as table</summary>
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}

export default ChartCard;
