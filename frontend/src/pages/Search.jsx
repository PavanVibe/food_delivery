import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { aiApi, foodsApi } from "../api";
import { errorMessage } from "../api/client";
import FoodGrid from "../components/FoodGrid";
import Icon from "../components/Icon";
import Loader from "../components/Loader";
import "./search.css";

const ENGINE_LABELS = {
  "rag-llm": "Retrieval + LLM ranking",
  "retrieval-only": "Semantic retrieval",
  popular: "Popular picks",
};

const EXAMPLES = ["Something spicy and high in protein", "Light vegetarian dinner", "A warm chocolate dessert"];

function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const mode = params.get("mode") === "keyword" ? "keyword" : "ai";
  const vegOnly = params.get("veg") === "1";
  const maxPrice = params.get("max") ?? "";

  const [input, setInput] = useState(query);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [response, setResponse] = useState({ key: null, result: null, error: "" });

  const key = JSON.stringify([query, mode, vegOnly, maxPrice]);
  const searching = query.trim().length >= 2;
  const loading = searching && response.key !== key;

  useEffect(() => {
    if (!searching) return;
    let active = true;
    const request =
      mode === "ai"
        ? aiApi.recommend({ query, veg_only: vegOnly, limit: 6, ...(maxPrice ? { max_price: Number(maxPrice) } : {}) })
        : foodsApi.search(query).then(({ data }) => ({ data: { matched_foods: data } }));

    request
      .then(({ data }) => active && setResponse({ key, result: data, error: "" }))
      .catch((err) => active && setResponse({ key, result: null, error: errorMessage(err, "Search failed, please try again") }));
    return () => {
      active = false;
    };
  }, [key, searching, query, mode, vegOnly, maxPrice]);

  const apply = (changes) => {
    const next = { q: query, mode, veg: vegOnly ? "1" : "", max: maxPrice, ...changes };
    setParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)));
  };

  const submit = (event) => {
    event.preventDefault();
    if (input.trim().length >= 2) apply({ q: input.trim(), max: maxInput });
  };

  const { result, error } = response.key === key ? response : { result: null, error: "" };
  const reasons = Object.fromEntries((result?.matched_foods ?? []).map((food) => [food.id, food.reason]));

  return (
    <div className="container page">
      <header className="page-header">
        <h1>{mode === "ai" ? "AI food search" : "Search dishes"}</h1>
        <p>
          {mode === "ai"
            ? "Describe what you feel like eating. Results are retrieved from the live menu, so every suggestion is a real dish you can order."
            : "Find dishes by name. Typos are fine — “panner” still finds paneer."}
        </p>
      </header>

      <form className="search-panel card" onSubmit={submit}>
        <div className="segmented" role="tablist" aria-label="Search mode">
          {[
            ["ai", "Ask AI", "sparkles"],
            ["keyword", "By name", "search"],
          ].map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={mode === value ? "is-active" : ""}
              onClick={() => apply({ mode: value })}
            >
              <Icon name={icon} size={15} /> {label}
            </button>
          ))}
        </div>

        <div className="search-row">
          <input
            className="input search-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === "ai" ? "e.g. a light vegetarian dinner under ₹250" : "e.g. paneer"}
            aria-label="Search query"
          />
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {mode === "ai" && (
          <div className="search-filters">
            <label className="checkbox">
              <input type="checkbox" checked={vegOnly} onChange={(event) => apply({ veg: event.target.checked ? "1" : "" })} />
              Vegetarian only
            </label>
            <label className="price-filter">
              Max price per dish
              <input
                type="number"
                min="50"
                step="50"
                className="input"
                value={maxInput}
                onChange={(event) => setMaxInput(event.target.value)}
                placeholder="Any"
              />
            </label>
          </div>
        )}

        {!query && mode === "ai" && (
          <div className="chip-row">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="chip"
                onClick={() => {
                  setInput(example);
                  apply({ q: example });
                }}
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </form>

      {loading && <Loader label={mode === "ai" ? "Finding the best matches" : "Searching"} />}
      {error && !loading && <div className="empty-state search-error">{error}</div>}

      {result && !loading && (
        <>
          {result.recommendation && (
            <div className="ai-answer">
              <div className="ai-answer-icon">
                <Icon name="sparkles" size={18} />
              </div>
              <div>
                <p>{result.recommendation}</p>
                <div className="ai-answer-meta">
                  <span>{ENGINE_LABELS[result.engine] ?? result.engine}</span>
                  <span>{result.retrieved} dishes considered</span>
                  {result.personalised && <span>Personalised to your order history</span>}
                </div>
              </div>
            </div>
          )}
          <FoodGrid
            title={mode === "ai" ? "Recommended dishes" : "Results"}
            subtitle={`${result.matched_foods?.length ?? 0} found`}
            foods={result.matched_foods ?? []}
            reasons={reasons}
            emptyMessage="Nothing on the menu matched. Try different words or relax the filters."
          />
        </>
      )}
    </div>
  );
}

export default Search;
