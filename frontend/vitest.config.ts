import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Cấu hình riêng cho test: `vite.config.ts` giữ nguyên cho build production.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Echo/Pusher giữ socket toàn cục; dọn DOM giữa các test để không rò rỉ.
    restoreMocks: true,
  },
});
