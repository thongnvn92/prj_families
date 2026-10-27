import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const moduleId = id.replace(/\\/g, "/");
          if (/\/node_modules\/(react|react-dom|scheduler|react-redux|redux|immer|reselect|@reduxjs\/toolkit)(\/|$)/.test(moduleId)) return "vendor-react";
          if (/\/node_modules\/(lucide-react|@radix-ui\/[^/]+|class-variance-authority|clsx|tailwind-merge|aria-hidden|react-remove-scroll|react-remove-scroll-bar|use-sidecar)(\/|$)/.test(moduleId)) return "vendor-ui";
          if (/\/node_modules\/(react-day-picker|date-fns)(\/|$)/.test(moduleId)) return "vendor-date";
          return undefined;
        },
      },
    },
  },
});
