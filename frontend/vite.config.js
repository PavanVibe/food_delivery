import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.VITE_PROXY_TARGET ?? "http://localhost:5000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
