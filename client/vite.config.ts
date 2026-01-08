import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // 2. Force the mapping here.
      // This tells Vite: "When you see @api, look exactly in ./src/api"
      "@api": path.resolve(__dirname, "./src/api"),
    },
  },
  server: {
    host: "0.0.0.0", // Erlaubt Zugriff über alle IP-Adressen (auch VPN)
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
