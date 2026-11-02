import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { useAuth, useToast } from "../context/contexts";
import "./auth.css";

const DEMO_ACCOUNTS = [
  ["Customer", "demo@foodhub.dev", "Demo@123"],
  ["Restaurant owner", "owner@foodhub.dev", "Owner@123"],
  ["Admin", "admin@foodhub.dev", "Admin@123"],
];

function Login() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = location.state?.from?.pathname ?? "/";
  if (isAuthenticated && !submitting) return <Navigate to={destination} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      const home = user.role !== "customer" && destination === "/" ? "/dashboard" : destination;
      navigate(home, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Login failed"));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="brand-mark">F</span>
          <h1>Welcome back</h1>
          <p>Log in to order food and track deliveries.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field" htmlFor="login-email">
            <span className="field-label">Email</span>
            <input
              id="login-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="field" htmlFor="login-password">
            <span className="field-label">Password</span>
            <input
              id="login-password"
              type="password"
              className="input"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="demo-accounts">
          <span>Try a demo account</span>
          <div className="chip-row">
            {DEMO_ACCOUNTS.map(([role, demoEmail, demoPassword]) => (
              <button
                key={demoEmail}
                type="button"
                className="chip"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword(demoPassword);
                }}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <p className="auth-switch">
          New to FoodHub? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
