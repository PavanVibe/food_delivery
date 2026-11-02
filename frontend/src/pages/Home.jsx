import { useEffect, useState } from "react";
import { aiApi, foodsApi } from "../api";
import { errorMessage } from "../api/client";
import FoodGrid from "../components/FoodGrid";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Icon from "../components/Icon";
import Loader from "../components/Loader";
import { useAuth } from "../context/contexts";
import "./home.css";

const SORTS = [
  ["rating", "Top rated"],
  ["price_asc", "Price: low to high"],
  ["price_desc", "Price: high to low"],
  ["name", "Name (A–Z)"],
];

function ForYou() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    aiApi
      .forYou()
      .then(({ data }) => setResult(data))
      .catch(() => setResult(null));
  }, []);

  if (!result?.matched_foods?.length) return null;
  const reasons = Object.fromEntries(result.matched_foods.map((food) => [food.id, food.reason]));
  return (
    <section className="for-you">
      <div className="for-you-header">
        <span className="for-you-badge">
          <Icon name="sparkles" size={14} /> {result.personalised ? "Picked for you" : "Popular right now"}
        </span>
        <p>{result.recommendation}</p>
      </div>
      <FoodGrid foods={result.matched_foods.slice(0, 4)} reasons={reasons} />
    </section>
  );
}

function Home() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category_id: undefined, veg: undefined, sort: "rating", page: 1 });
  const [foods, setFoods] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    foodsApi
      .categories()
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    foodsApi
      .list({ ...filters, limit: 12 })
      .then(({ data, meta: pageMeta }) => {
        if (!active) return;
        setFoods((previous) => (filters.page === 1 ? data : [...previous, ...data]));
        setMeta(pageMeta);
        setError("");
      })
      .catch((err) => active && setError(errorMessage(err, "Could not load the menu")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filters]);

  const update = (changes) => {
    setLoading(true);
    setFilters((current) => ({ ...current, page: 1, ...changes }));
  };

  return (
    <>
      <Hero />
      <div className="container">
        {isAuthenticated && <ForYou />}

        <section className="menu-section">
          <div className="section-title">
            <h2>Explore the menu</h2>
            {meta && <span>{meta.total} dishes</span>}
          </div>

          <div className="menu-toolbar">
            <div className="chip-row" role="group" aria-label="Category">
              <button className={`chip ${!filters.category_id ? "is-active" : ""}`} onClick={() => update({ category_id: undefined })}>
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`chip ${filters.category_id === category.id ? "is-active" : ""}`}
                  onClick={() => update({ category_id: category.id })}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="toolbar-controls">
              <label className="checkbox">
                <input type="checkbox" checked={filters.veg === true} onChange={(e) => update({ veg: e.target.checked || undefined })} />
                Veg only
              </label>
              <select className="select" value={filters.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort by">
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="empty-state">{error}</div>
          ) : loading && filters.page === 1 ? (
            <Loader label="Loading menu" />
          ) : (
            <FoodGrid foods={foods} />
          )}

          {meta && meta.page < meta.total_pages && (
            <div className="load-more">
              <button
                className="btn btn-secondary"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setFilters((current) => ({ ...current, page: current.page + 1 }));
                }}
              >
                {loading ? "Loading…" : "Show more dishes"}
              </button>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}

export default Home;
