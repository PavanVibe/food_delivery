import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProtectedRoute from "../components/ProtectedRoute";
import { renderWithProviders } from "./renderWithProviders";

const routes = [
  ["/login", <p key="login">login page</p>],
  ["/", <p key="home">home page</p>],
];

const guarded = (roles) => (
  <ProtectedRoute roles={roles}>
    <p>secret</p>
  </ProtectedRoute>
);

describe("ProtectedRoute", () => {
  it("redirects anonymous visitors to login", () => {
    renderWithProviders(guarded(), { route: "/orders", extraRoutes: routes });
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the page for a logged-in user", () => {
    renderWithProviders(guarded(), { route: "/orders", auth: { user: { role: "customer" } } });
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("sends customers away from staff-only pages", () => {
    renderWithProviders(guarded(["admin"]), { route: "/dashboard", auth: { user: { role: "customer" } }, extraRoutes: routes });
    expect(screen.getByText("home page")).toBeInTheDocument();
  });

  it("waits while the session is being restored", () => {
    renderWithProviders(guarded(), { route: "/orders", auth: { loading: true } });
    expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
  });
});
