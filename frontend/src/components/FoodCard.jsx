import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { useAuth, useCart, useToast } from "../context/contexts";
import { currency, SPICE_LABELS } from "../utils/format";
import Icon from "./Icon";
import "./foodcard.css";

function FoodCard({ food, reason }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const addToCart = async () => {
    if (!isAuthenticated) {
      toast.notify("Log in to start your order");
      navigate("/login", { state: { from: location } });
      return;
    }
    setAdding(true);
    try {
      await addItem(food.id);
      setAdded(true);
      toast.success(`${food.name} added to cart`);
      setTimeout(() => setAdded(false), 1500);
    } catch (error) {
      toast.error(errorMessage(error, "Could not add to cart"));
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="food-card">
      <div className="food-media">
        {food.image_url && !imageFailed ? (
          <img src={food.image_url} alt={food.name} loading="lazy" onError={() => setImageFailed(true)} />
        ) : (
          <div className="food-placeholder" aria-hidden="true">
            {food.name.slice(0, 1)}
          </div>
        )}
      </div>

      <div className="food-body">
        <div className="food-heading">
          <span className={`diet-mark ${food.is_veg ? "veg" : "non-veg"}`} title={food.is_veg ? "Vegetarian" : "Non-vegetarian"} />
          <span className="sr-only">{food.is_veg ? "Vegetarian" : "Non-vegetarian"}</span>
          <h3 className="food-name" title={food.name}>
            {food.name}
          </h3>
        </div>

        {food.restaurant_name && <p className="food-restaurant">{food.restaurant_name}</p>}

        <div className="food-meta">
          <span className="rating">
            <Icon name="star" size={11} filled /> {Number(food.rating).toFixed(1)}
          </span>
          {food.spice_level > 0 && <span>{SPICE_LABELS[food.spice_level]}</span>}
        </div>

        {reason && (
          <p className="food-reason">
            <Icon name="sparkles" size={14} /> {reason}
          </p>
        )}

        <div className="food-footer">
          <span className="food-price">{currency(food.price)}</span>
          <button className={`btn btn-sm ${added ? "btn-secondary" : "btn-primary"}`} onClick={addToCart} disabled={adding}>
            {adding ? "Adding…" : added ? <><Icon name="check" size={14} /> Added</> : <><Icon name="plus" size={14} /> Add to cart</>}
          </button>
        </div>
      </div>
    </article>
  );
}

export default FoodCard;
