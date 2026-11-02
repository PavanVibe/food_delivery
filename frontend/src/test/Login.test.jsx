import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Login from "../pages/Login";
import { renderWithProviders } from "./renderWithProviders";

describe("Login", () => {
  it("logs in and sends staff to the dashboard", async () => {
    const login = vi.fn().mockResolvedValue({ name: "Riya Kapoor", role: "restaurant_owner" });
    renderWithProviders(<Login />, {
      route: "/login",
      auth: { login },
      extraRoutes: [["/dashboard", <p key="d">dashboard</p>]],
    });

    await userEvent.type(screen.getByLabelText("Email"), "owner@foodhub.dev");
    await userEvent.type(screen.getByLabelText("Password"), "Owner@123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(login).toHaveBeenCalledWith({ email: "owner@foodhub.dev", password: "Owner@123" });
    expect(await screen.findByText("dashboard")).toBeInTheDocument();
  });

  it("shows the API error message", async () => {
    const login = vi.fn().mockRejectedValue({ response: { data: { error: { message: "Invalid email or password" } } } });
    renderWithProviders(<Login />, { route: "/login", auth: { login } });

    await userEvent.click(screen.getByRole("button", { name: "Customer" }));
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });
});
