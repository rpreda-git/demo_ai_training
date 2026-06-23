import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    // Router plugin must run before the React plugin.
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/client/routes",
      generatedRouteTree: "src/client/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    cloudflare(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src/client"),
      "@shared": path.resolve(import.meta.dirname, "./src/shared"),
    },
  },
});
