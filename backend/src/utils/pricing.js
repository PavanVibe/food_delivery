export const DELIVERY_FEE = 49;
export const FREE_DELIVERY_THRESHOLD = 499;

export const roundMoney = (value) => Math.round(value * 100) / 100;

export function computeTotals(items) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return { subtotal, delivery_fee: deliveryFee, total: roundMoney(subtotal + deliveryFee) };
}
