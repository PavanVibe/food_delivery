import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import "./searchbar.css";

// Natural-language prompt that hands off to the AI search page
function SearchBar({ suggestions = [] }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const go = (text) => {
    const trimmed = text.trim();
    if (trimmed.length >= 2) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="searchbar-wrap">
      <form
        className="searchbar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(query);
        }}
      >
        <Icon name="sparkles" size={20} className="searchbar-icon" />
        <input
          className="searchbar-input"
          aria-label="Describe what you want to eat"
          placeholder="e.g. something spicy and high in protein under ₹300"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-lg">
          Ask AI
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="chip-row">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" className="chip" onClick={() => go(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
