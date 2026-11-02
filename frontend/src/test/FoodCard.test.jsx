import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FoodCard from "../components/FoodCard";
import { renderWithProviders } from "./renderWithProviders";

const food = { id: 7, name: "Masala Dosa", price: 139, rating: 4.6, is_veg: true, spice_level: 1, restaurant_name: "Dosa Junction" };

describe("FoodCard", () => {
  it("shows price, diet and the AI reason", () => {
    renderWithProviders(<FoodCard food={food} reason="Crispy and light" />);
    expect(screen.getByText("₹139")).toBeInTheDocument();
    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
    expect(screen.getByText("Crispy and light")).toBeInTheDocument();
  });

  it("sends anonymous users to login instead of adding", async () => {
    const { cart } = renderWithProviders(<FoodCard food={food} />, { extraRoutes: [["/login", <p key="l">login page</p>]] });
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(cart.addItem).not.toHaveBeenCalled();
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("adds to the cart when logged in", async () => {
    const addItem = vi.fn().mockResolvedValue({});
    const { toast } = renderWithProviders(<FoodCard food={food} />, {
      auth: { isAuthenticated: true, user: { role: "customer" } },
      cart: { addItem },
    });
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(addItem).toHaveBeenCalledWith(7);
    expect(toast.success).toHaveBeenCalled();
  });
});
