import { Link } from "react-router-dom";
import "./footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>FoodHub</strong>
            <p>AI-powered food delivery and restaurant analytics.</p>
          </div>
        </div>
        <nav className="footer-links" aria-label="Footer">
          <Link to="/restaurants">Restaurants</Link>
          <Link to="/search">AI Search</Link>
          <a href="https://github.com/PavanVibe/food_delivery" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
        <p className="footer-copy">© {new Date().getFullYear()} FoodHub. Built with React, Express, FastAPI and PostgreSQL.</p>
      </div>
    </footer>
  );
}

export default Footer;
