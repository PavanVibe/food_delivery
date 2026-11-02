import { useCallback, useEffect, useMemo, useState } from "react";
import { cartApi } from "../api";
import { CartContext, useAuth } from "./contexts";

const EMPTY_CART = { items: [], item_count: 0, subtotal: 0, delivery_fee: 0, total: 0 };

export default function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);

  useEffect(() => {
    if (!user) return;
    cartApi
      .get()
      .then(({ data }) => setCart(data))
      .catch(() => setCart(EMPTY_CART));
  }, [user]);

  const apply = useCallback(async (request) => {
    const { data } = await request;
    setCart(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      cart: user ? cart : EMPTY_CART,
      addItem: (foodId, quantity = 1) => apply(cartApi.add(foodId, quantity)),
      updateItem: (foodId, quantity) => apply(cartApi.update(foodId, quantity)),
      removeItem: (foodId) => apply(cartApi.remove(foodId)),
      clear: () => apply(cartApi.clear()),
      reset: () => setCart(EMPTY_CART),
    }),
    [user, cart, apply]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
