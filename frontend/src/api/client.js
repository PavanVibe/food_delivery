import axios from "axios";

export const TOKEN_KEY = "foodhub_token";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 50000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let handleUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  handleUnauthorized = handler;
};

// An expired/invalid token logs the user out everywhere
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) handleUnauthorized();
    return Promise.reject(error);
  }
);

export function errorMessage(error, fallback = "Something went wrong") {
  const body = error?.response?.data?.error;
  if (body?.details?.length) return body.details.map((detail) => detail.message).join(". ");
  if (body?.message) return body.message;
  if (error?.code === "ECONNABORTED") return "The request timed out";
  if (!error?.response) return "Cannot reach the server";
  return fallback;
}

export default client;
