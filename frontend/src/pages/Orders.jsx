import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ordersApi } from "../api";
import { errorMessage } from "../api/client";
import Icon from "../components/Icon";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import { useToast } from "../context/contexts";
import { currency, dateTime } from "../utils/format";
import "./orders.css";

const PAGE_SIZE = 10;

function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    ordersApi
      .mine({ page, limit: PAGE_SIZE })
      .then(({ data, meta: pageMeta }) => {
        if (!active) return;
        setOrders((current) => (page === 1 ? data : [...current, ...data]));
        setMeta(pageMeta);
        setError("");
      })
      .catch((err) => active && setError(errorMessage(err, "Could not load your orders")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  const cancel = async (order) => {
    try {
      const { data } = await ordersApi.cancel(order.id);
      setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, status: data.status } : o)));
      toast.success(`Order #${order.id} cancelled`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not cancel the order"));
    }
  };

  return (
    <div className="container page">
      <header className="page-header">
        <h1>Your orders</h1>
        <p>{meta ? `${meta.total} ${meta.total === 1 ? "order" : "orders"} placed` : "Track and manage your orders"}</p>
      </header>

      {error && <div className="empty-state">{error}</div>}
      {loading && orders.length === 0 && <Loader label="Loading orders" />}

      {!loading && !error && orders.length === 0 ? (
        <div className="empty-state">
          <Icon name="bag" size={32} />
          <h3>No orders yet</h3>
          <Link to="/" className="btn btn-primary">
            Start ordering
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article key={order.id} className="card order-card">
              <header className="order-header">
                <div>
                  <h3>{order.restaurant_name}</h3>
                  <p>
                    Order #{order.id} · {dateTime(order.created_at)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </header>

              <ul className="order-items">
                {order.items.map((item) => (
                  <li key={item.food_id}>
                    <span>
                      <span className="order-qty">{item.quantity}×</span> {item.name}
                    </span>
                    <span>{currency(item.quantity * item.unit_price)}</span>
                  </li>
                ))}
              </ul>

              <footer className="order-footer">
                <div className="order-totals">
                  <span>Delivery {order.delivery_fee ? currency(order.delivery_fee) : "free"}</span>
                  <strong>Total {currency(order.total)}</strong>
                </div>
                {order.status === "pending" && (
                  <button className="btn btn-danger btn-sm" onClick={() => cancel(order)}>
                    Cancel order
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      {meta && meta.page < meta.total_pages && (
        <div className="load-more">
          <button
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setPage((current) => current + 1);
            }}
          >
            {loading ? "Loading…" : "Load more orders"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Orders;
