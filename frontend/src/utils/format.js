const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const compactNumber = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export const currency = (value) => inr.format(Number(value) || 0);
export const compact = (value) => compactNumber.format(Number(value) || 0);
export const compactCurrency = (value) => `₹${compact(value)}`;

export const dateTime = (value) =>
  new Date(value).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const shortDate = (isoDay) =>
  new Date(`${isoDay}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const hourLabel = (hour) => `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;

export const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const NEXT_STATUS = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

export const SPICE_LABELS = ["Mild", "Mildly spiced", "Spicy", "Very spicy"];
