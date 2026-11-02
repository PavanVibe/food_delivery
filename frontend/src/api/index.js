import client from "./client";

const body = (request) => request.then((response) => response.data);

export const authApi = {
  login: (credentials) => body(client.post("/auth/login", credentials)),
  register: (details) => body(client.post("/auth/register", details)),
  me: () => body(client.get("/auth/me")),
};

export const foodsApi = {
  list: (params) => body(client.get("/foods", { params })),
  search: (q) => body(client.get("/foods/search", { params: { q } })),
  get: (id) => body(client.get(`/foods/${id}`)),
  categories: () => body(client.get("/categories")),
  create: (food) => body(client.post("/foods", food)),
  update: (id, changes) => body(client.patch(`/foods/${id}`, changes)),
  remove: (id) => client.delete(`/foods/${id}`),
};

export const restaurantsApi = {
  list: (params) => body(client.get("/restaurants", { params })),
  get: (id) => body(client.get(`/restaurants/${id}`)),
  mine: () => body(client.get("/restaurants/mine")),
};

export const cartApi = {
  get: () => body(client.get("/cart")),
  add: (foodId, quantity = 1) => body(client.post("/cart/items", { food_id: foodId, quantity })),
  update: (foodId, quantity) => body(client.patch(`/cart/items/${foodId}`, { quantity })),
  remove: (foodId) => body(client.delete(`/cart/items/${foodId}`)),
  clear: () => body(client.delete("/cart")),
};

export const ordersApi = {
  checkout: (deliveryAddress) => body(client.post("/orders", { delivery_address: deliveryAddress })),
  mine: (params) => body(client.get("/orders", { params })),
  get: (id) => body(client.get(`/orders/${id}`)),
  cancel: (id) => body(client.patch(`/orders/${id}/cancel`)),
  manage: (params) => body(client.get("/orders/manage", { params })),
  updateStatus: (id, status) => body(client.patch(`/orders/${id}/status`, { status })),
};

export const aiApi = {
  recommend: (request) => body(client.post("/ai/recommend", request)),
  forYou: () => body(client.get("/ai/for-you")),
};

export const analyticsApi = {
  summary: (params) => body(client.get("/analytics/summary", { params })),
  sales: (params) => body(client.get("/analytics/sales", { params })),
  topFoods: (params) => body(client.get("/analytics/top-foods", { params })),
  peakHours: (params) => body(client.get("/analytics/peak-hours", { params })),
};
