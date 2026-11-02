import { useCallback, useEffect, useState } from "react";
import { analyticsApi, ordersApi, restaurantsApi } from "../api";
import { errorMessage } from "../api/client";
import BarList from "../components/charts/BarList";
import ChartCard from "../components/charts/ChartCard";
import ColumnChart from "../components/charts/ColumnChart";
import LineChart from "../components/charts/LineChart";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import { useAuth, useToast } from "../context/contexts";
import { compact, compactCurrency, currency, dateTime, hourLabel, NEXT_STATUS, shortDate, STATUS_LABELS } from "../utils/format";
import "./dashboard.css";

const QUEUE_PREVIEW = 6;

const RANGES = [
  [7, "7 days"],
  [30, "30 days"],
  [90, "90 days"],
];

function StatTile({ label, value, delta }) {
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <div className="stat-tile card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {delta !== undefined && delta !== null && (
        <span className={`stat-delta ${direction}`}>
          {direction === "up" ? "▲" : direction === "down" ? "▼" : "■"} {Math.abs(delta)}%
          <span className="stat-delta-note"> vs previous period</span>
        </span>
      )}
    </div>
  );
}

function OrderQueue({ restaurantId }) {
  const toast = useToast();
  const [orders, setOrders] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? orders : orders?.slice(0, QUEUE_PREVIEW);

  const load = useCallback(() => {
    ordersApi
      .manage({ status: "active", limit: 50, ...(restaurantId ? { restaurant_id: restaurantId } : {}) })
      .then(({ data }) => setOrders(data))
      .catch((err) => toast.error(errorMessage(err, "Could not load live orders")));
  }, [restaurantId, toast]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const move = async (order, status) => {
    setBusyId(order.id);
    try {
      await ordersApi.updateStatus(order.id, status);
      toast.success(`Order #${order.id} marked ${STATUS_LABELS[status].toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the order"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card queue">
      <header className="queue-header">
        <div>
          <h3>Live orders</h3>
          <p>Orders that still need action · refreshes every 30 seconds</p>
        </div>
        {orders && <span className="queue-count">{orders.length} active</span>}
      </header>

      {orders?.length === 0 && <p className="chart-empty">No active orders right now.</p>}
      {!orders && <Loader label="Loading orders" />}

      <div className="queue-list">
        {visible?.map((order) => (
          <article key={order.id} className="queue-item">
            <div className="queue-main">
              <div className="queue-title">
                <strong>#{order.id}</strong>
                <span>{order.restaurant_name}</span>
                <span className="queue-time">{dateTime(order.created_at)}</span>
              </div>
              <div className="queue-items">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}</div>
              <div className="queue-meta">
                {order.customer_name} · {currency(order.total)} · {order.delivery_address}
              </div>
            </div>
            <div className="queue-actions">
              <StatusBadge status={order.status} />
              {NEXT_STATUS[order.status] && (
                <button className="btn btn-primary btn-sm" disabled={busyId === order.id} onClick={() => move(order, NEXT_STATUS[order.status])}>
                  Mark {STATUS_LABELS[NEXT_STATUS[order.status]].toLowerCase()}
                </button>
              )}
              {["pending", "confirmed"].includes(order.status) && (
                <button className="btn btn-danger btn-sm" disabled={busyId === order.id} onClick={() => move(order, "cancelled")}>
                  Reject
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {orders?.length > QUEUE_PREVIEW && (
        <div className="queue-more">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAll((current) => !current)}>
            {showAll ? "Show fewer" : `Show all ${orders.length} orders`}
          </button>
        </div>
      )}
    </section>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({ days: 30, restaurant_id: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    restaurantsApi
      .mine()
      .then(({ data: list }) => setRestaurants(list))
      .catch(() => setRestaurants([]));
  }, []);

  useEffect(() => {
    let active = true;
    const params = { days: filters.days, ...(filters.restaurant_id ? { restaurant_id: filters.restaurant_id } : {}) };
    Promise.all([
      analyticsApi.summary(params),
      analyticsApi.sales(params),
      analyticsApi.topFoods({ ...params, limit: 8 }),
      analyticsApi.peakHours(params),
    ])
      .then(([summary, sales, topFoods, peakHours]) => {
        if (!active) return;
        setData({ summary: summary.data, sales: sales.data, topFoods: topFoods.data, peakHours: peakHours.data });
        setError("");
      })
      .catch((err) => active && setError(errorMessage(err, "Could not load analytics")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);

  const update = (changes) => {
    setLoading(true);
    setFilters((current) => ({ ...current, ...changes }));
  };

  const summary = data?.summary;
  const allLabel = user.role === "admin" ? "All restaurants" : "All my restaurants";

  return (
    <div className="container page">
      <header className="page-header dashboard-header">
        <div>
          <h1>Restaurant dashboard</h1>
          <p>Sales, demand and live orders{user.role === "admin" ? " across the platform" : " for your restaurants"}.</p>
        </div>
      </header>

      <div className="filter-row">
        <div className="segmented" role="group" aria-label="Date range">
          {RANGES.map(([days, label]) => (
            <button key={days} className={filters.days === days ? "is-active" : ""} onClick={() => update({ days })}>
              {label}
            </button>
          ))}
        </div>
        <select
          className="select"
          value={filters.restaurant_id}
          onChange={(event) => update({ restaurant_id: event.target.value })}
          aria-label="Restaurant"
        >
          <option value="">{allLabel}</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="empty-state">{error}</div>}
      {!data && !error && <Loader label="Loading analytics" />}

      {data && (
        <div className={loading ? "skeleton-fade" : ""}>
          <div className="stat-grid">
            <StatTile label="Revenue" value={compactCurrency(summary.revenue)} delta={summary.growth.revenue_pct} />
            <StatTile label="Orders" value={compact(summary.total_orders)} delta={summary.growth.orders_pct} />
            <StatTile label="Average order value" value={currency(summary.avg_order_value)} />
            <StatTile label="Unique customers" value={compact(summary.unique_customers)} />
            <StatTile label="Cancelled orders" value={compact(summary.cancelled_orders)} />
          </div>

          <div className="chart-grid">
            <ChartCard
              title="Revenue per day"
              subtitle={`Last ${filters.days} days · excludes cancelled orders`}
              columns={["Day", "Revenue", "Orders"]}
              rows={data.sales.map((d) => [shortDate(d.day), currency(d.revenue), d.orders])}
            >
              <LineChart
                label={`Daily revenue for the last ${filters.days} days`}
                data={data.sales.map((d) => ({ x: d.day, value: d.revenue, extra: `${d.orders} orders` }))}
                formatValue={currency}
                formatAxis={compactCurrency}
                formatX={shortDate}
              />
            </ChartCard>

            <ChartCard
              title="Orders by hour"
              subtitle="When customers order (IST)"
              columns={["Hour", "Orders"]}
              rows={data.peakHours.map((d) => [hourLabel(d.hour), d.orders])}
            >
              <ColumnChart
                label="Orders by hour of day"
                data={data.peakHours.map((d) => ({ x: d.hour, value: d.orders }))}
                formatValue={compact}
                formatX={hourLabel}
              />
            </ChartCard>

            <ChartCard
              title="Top dishes"
              subtitle="By units sold"
              columns={["Dish", "Units", "Revenue"]}
              rows={data.topFoods.map((d) => [d.name, d.quantity, currency(d.revenue)])}
            >
              <BarList
                data={data.topFoods.map((d) => ({ key: d.id, label: d.name, hint: d.restaurant_name, value: d.quantity }))}
                formatValue={(value) => `${compact(value)} sold`}
              />
            </ChartCard>

            <ChartCard title="Order status" subtitle={`Last ${filters.days} days`}>
              <table className="status-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Orders</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.status_breakdown.map((row) => (
                    <tr key={row.status}>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td>{row.count.toLocaleString("en-IN")}</td>
                      <td>{summary.total_orders ? `${((row.count / summary.total_orders) * 100).toFixed(1)}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ChartCard>
          </div>
        </div>
      )}

      <OrderQueue restaurantId={filters.restaurant_id} />
    </div>
  );
}

export default Dashboard;
