import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ordersApi } from "../api";
import { errorMessage } from "../api/client";
import Icon from "../components/Icon";
import { useCart, useToast } from "../context/contexts";
import { currency } from "../utils/format";
import "./cart.css";

function Cart() {
  const { cart, updateItem, removeItem, clear, reset } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState(() => localStorage.getItem("foodhub_address") ?? "");
  const [busy, setBusy] = useState(false);

  const run = async (action, failure) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(errorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };

  const placeOrder = (event) => {
    event.preventDefault();
    run(async () => {
      const { data: orders } = await ordersApi.checkout(address);
      localStorage.setItem("foodhub_address", address);
      reset();
      toast.success(orders.length > 1 ? `${orders.length} orders placed — one per restaurant` : "Order placed successfully");
      navigate("/orders");
    }, "Checkout failed");
  };

  if (cart.items.length === 0) {
    return (
      <div className="container page">
        <header className="page-header">
          <h1>Your cart</h1>
        </header>
        <div className="empty-state">
          <Icon name="cart" size={32} />
          <h3>Your cart is empty</h3>
          <p>Browse the menu or ask the AI for ideas.</p>
          <div className="empty-actions">
            <Link to="/" className="btn btn-secondary">
              Browse menu
            </Link>
            <Link to="/search" className="btn btn-primary">
              <Icon name="sparkles" size={16} /> Ask AI
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <header className="page-header">
        <h1>Your cart</h1>
        <p>
          {cart.item_count} {cart.item_count === 1 ? "item" : "items"} · prices are confirmed by the server at checkout
        </p>
      </header>

      <div className="cart-layout">
        <section className="card cart-items">
          {cart.items.map((item) => (
            <div key={item.food_id} className={`cart-item ${item.is_available ? "" : "is-unavailable"}`}>
              {item.image_url ? (
                <img src={item.image_url} alt="" className="cart-thumb" />
              ) : (
                <div className="cart-thumb cart-thumb-placeholder">{item.name.slice(0, 1)}</div>
              )}

              <div className="cart-item-main">
                <div className="cart-item-name">
                  <span className={`diet-mark ${item.is_veg ? "veg" : "non-veg"}`} />
                  {item.name}
                </div>
                <div className="cart-item-sub">{item.restaurant_name}</div>
                {!item.is_available && <div className="cart-item-warning">Currently unavailable — remove to check out</div>}
              </div>

              <div className="qty-stepper" role="group" aria-label={`Quantity of ${item.name}`}>
                <button
                  disabled={busy || item.quantity <= 1}
                  onClick={() => run(() => updateItem(item.food_id, item.quantity - 1), "Could not update quantity")}
                  aria-label="Decrease quantity"
                >
                  <Icon name="minus" size={14} />
                </button>
                <span>{item.quantity}</span>
                <button
                  disabled={busy || item.quantity >= 20}
                  onClick={() => run(() => updateItem(item.food_id, item.quantity + 1), "Could not update quantity")}
                  aria-label="Increase quantity"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>

              <div className="cart-item-price">{currency(item.price * item.quantity)}</div>

              <button
                className="icon-btn"
                aria-label={`Remove ${item.name}`}
                disabled={busy}
                onClick={() => run(() => removeItem(item.food_id), "Could not remove item")}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
          <div className="cart-items-footer">
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => run(clear, "Could not clear cart")}>
              Clear cart
            </button>
          </div>
        </section>

        <form className="card cart-summary" onSubmit={placeOrder}>
          <h2>Order summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>{currency(cart.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery fee</span>
            <span>{cart.delivery_fee === 0 ? <span className="free">Free</span> : currency(cart.delivery_fee)}</span>
          </div>
          {cart.delivery_fee > 0 && <p className="summary-hint">Free delivery on orders above ₹499 per restaurant.</p>}

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{currency(cart.total)}</span>
          </div>

          <label className="field">
            <span className="field-label">Delivery address</span>
            <textarea
              className="textarea"
              rows={3}
              required
              minLength={5}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Flat, street, area, city"
            />
          </label>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? "Placing order…" : `Place order · ${currency(cart.total)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Cart;
