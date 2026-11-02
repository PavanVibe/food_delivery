import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext, CartContext, ToastContext } from "../context/contexts";

export const toastStub = () => ({ notify: vi.fn(), success: vi.fn(), error: vi.fn() });

export function renderWithProviders(ui, { auth = {}, cart = {}, route = "/", extraRoutes = [] } = {}) {
  const authValue = { user: null, loading: false, isAuthenticated: false, isStaff: false, login: vi.fn(), register: vi.fn(), logout: vi.fn(), ...auth };
  const cartValue = { cart: { items: [], item_count: 0, subtotal: 0, delivery_fee: 0, total: 0 }, addItem: vi.fn(), ...cart };
  const toast = toastStub();

  const utils = render(
    <ToastContext.Provider value={toast}>
      <AuthContext.Provider value={authValue}>
        <CartContext.Provider value={cartValue}>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={route.split("?")[0]} element={ui} />
              {extraRoutes.map(([path, element]) => (
                <Route key={path} path={path} element={element} />
              ))}
            </Routes>
          </MemoryRouter>
        </CartContext.Provider>
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
  return { ...utils, auth: authValue, cart: cartValue, toast };
}
