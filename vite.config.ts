import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://datingpay.ru",
        changeOrigin: true,
      },
      "/sse": {
        target: "http://datingpay.ru",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});
