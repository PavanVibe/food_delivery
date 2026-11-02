import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth, useCart, useToast } from "../context/contexts";
import Icon from "./Icon";
import "./navbar.css";

const ROLE_LABELS = { customer: "Customer", restaurant_owner: "Restaurant owner", admin: "Admin" };

function Navbar() {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const { cart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("You have been logged out");
    navigate("/");
  };

  const navClass = ({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="FoodHub home">
          <span className="brand-mark">F</span>
          FoodHub
        </Link>

        <nav className="nav-links" aria-label="Main">
          <NavLink to="/" end className={navClass}>
            Home
          </NavLink>
          <NavLink to="/search" className={navClass}>
            <Icon name="sparkles" size={16} /> AI Search
          </NavLink>
          <NavLink to="/restaurants" className={navClass}>
            Restaurants
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={navClass}>
              Orders
            </NavLink>
          )}
          {isStaff && (
            <NavLink to="/dashboard" className={navClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <NavLink to="/cart" className="cart-button" aria-label={`Cart, ${cart.item_count} items`}>
                <Icon name="cart" size={20} />
                {cart.item_count > 0 && <span className="cart-count">{cart.item_count}</span>}
              </NavLink>
              <div className="user-chip" title={user.email}>
                <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="user-meta">
                  <span className="user-name">{user.name.split(" ")[0]}</span>
                  <span className="user-role">{ROLE_LABELS[user.role]}</span>
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                <Icon name="logout" size={16} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
