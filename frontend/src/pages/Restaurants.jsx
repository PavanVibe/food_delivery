import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { restaurantsApi } from "../api";
import { errorMessage } from "../api/client";
import Icon from "../components/Icon";
import Loader from "../components/Loader";
import "./restaurants.css";

function Restaurants() {
  const [restaurants, setRestaurants] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    restaurantsApi
      .list()
      .then(({ data }) => setRestaurants(data))
      .catch((err) => setError(errorMessage(err, "Could not load restaurants")));
  }, []);

  return (
    <div className="container page">
      <header className="page-header">
        <h1>Restaurants</h1>
        <p>{restaurants ? `${restaurants.length} restaurants delivering near you` : "Finding restaurants near you"}</p>
      </header>

      {error && <div className="empty-state">{error}</div>}
      {!restaurants && !error && <Loader label="Loading restaurants" />}

      <div className="restaurant-grid">
        {restaurants?.map((restaurant) => (
          <Link key={restaurant.id} to={`/restaurants/${restaurant.id}`} className="restaurant-card">
            <div className="restaurant-image" style={{ backgroundImage: restaurant.image_url ? `url(${restaurant.image_url})` : "none" }} />
            <div className="restaurant-info">
              <div className="restaurant-title">
                <h3>{restaurant.name}</h3>
                <span className="rating">
                  <Icon name="star" size={11} filled /> {Number(restaurant.rating).toFixed(1)}
                </span>
              </div>
              <p className="restaurant-cuisine">{restaurant.cuisine}</p>
              <p className="restaurant-description">{restaurant.description}</p>
              <div className="restaurant-meta">
                <span>
                  <Icon name="clock" size={14} /> {restaurant.delivery_time_min} min
                </span>
                <span>
                  <Icon name="bag" size={14} /> {restaurant.menu_items} dishes
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Restaurants;
