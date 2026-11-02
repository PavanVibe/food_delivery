import SearchBar from "./SearchBar";
import "./hero.css";

const SUGGESTIONS = ["Spicy and high in protein", "Light vegetarian dinner", "Something sweet under ₹200"];

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <span className="hero-eyebrow">AI-powered food delivery</span>
        <h1 className="hero-title">
          Tell us what you&apos;re craving.
          <br />
          <span>We&apos;ll find the perfect dish.</span>
        </h1>
        <p className="hero-subtitle">
          Describe a mood, a diet or a budget in plain words. Our recommendation engine searches every menu and picks
          dishes that actually match.
        </p>
        <SearchBar suggestions={SUGGESTIONS} />
      </div>
    </section>
  );
}

export default Hero;
