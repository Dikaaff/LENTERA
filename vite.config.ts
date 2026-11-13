import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "LENTERA — Laporan Lapangan",
        short_name: "LENTERA",
        description: "Field reports that survive when the network does not.",
        theme_color: "#0b0f0e",
        background_color: "#0b0f0e",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,svg,geojson}"] },
    }),
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/**"],
  },
});
