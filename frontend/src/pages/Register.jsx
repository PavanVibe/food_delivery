import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { useAuth, useToast } from "../context/contexts";
import "./auth.css";

function Register() {
  const { register, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !submitting) return <Navigate to="/" replace />;

  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const user = await register(form);
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}!`);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Registration failed"));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <span className="brand-mark">F</span>
          <h1>Create your account</h1>
          <p>Get personalised recommendations from your order history.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field" htmlFor="register-name">
            <span className="field-label">Full name</span>
            <input
              id="register-name"
              className="input"
              value={form.name}
              onChange={set("name")}
              autoComplete="name"
              minLength={2}
              required
            />
          </label>

          <label className="field" htmlFor="register-email">
            <span className="field-label">Email</span>
            <input
              id="register-email"
              type="email"
              className="input"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              required
            />
          </label>

          <label className="field" htmlFor="register-password">
            <span className="field-label">Password</span>
            <input
              id="register-password"
              type="password"
              className="input"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <span className="field-hint">At least 8 characters, including a letter and a number.</span>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
