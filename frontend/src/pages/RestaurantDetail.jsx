import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { restaurantsApi } from "../api";
import { errorMessage } from "../api/client";
import FoodGrid from "../components/FoodGrid";
import Icon from "../components/Icon";
import Loader from "../components/Loader";
import "./restaurants.css";

function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    restaurantsApi
      .get(id)
      .then(({ data }) => setRestaurant(data))
      .catch((err) => setError(errorMessage(err, "Could not load this restaurant")));
  }, [id]);

  if (error) {
    return (
      <div className="container page">
        <div className="empty-state">
          <h3>{error}</h3>
          <Link to="/restaurants">Back to restaurants</Link>
        </div>
      </div>
    );
  }
  if (!restaurant) return <Loader label="Loading menu" />;

  return (
    <div className="container page">
      <Link to="/restaurants" className="back-link">
        <Icon name="arrowLeft" size={16} /> All restaurants
      </Link>

      <header className="restaurant-hero card">
        <div className="restaurant-hero-image" style={{ backgroundImage: restaurant.image_url ? `url(${restaurant.image_url})` : "none" }} />
        <div className="restaurant-hero-body">
          <p className="restaurant-cuisine">{restaurant.cuisine}</p>
          <h1>{restaurant.name}</h1>
          <p className="restaurant-description">{restaurant.description}</p>
          <div className="restaurant-meta">
            <span className="rating">
              <Icon name="star" size={11} filled /> {Number(restaurant.rating).toFixed(1)}
            </span>
            <span>
              <Icon name="clock" size={14} /> {restaurant.delivery_time_min} min delivery
            </span>
            <span>
              <Icon name="pin" size={14} /> {restaurant.address}
            </span>
          </div>
        </div>
      </header>

      <FoodGrid title="Menu" subtitle={`${restaurant.menu.length} dishes`} foods={restaurant.menu} />
    </div>
  );
}

export default RestaurantDetail;
