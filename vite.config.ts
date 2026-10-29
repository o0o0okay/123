import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
//
// Output is split, not inlined: the shell (React + the home screen) loads first,
// every heavier panel is a hashed chunk fetched on demand, and the artwork lives
// in its own chunk so that changing code never re-downloads the car sprites
// (and vice versa). Hashed assets can then be served with a one-year immutable
// cache. Run `npm run build:single` when a single self-contained HTML file is
// needed (demos, offline sharing) — see vite.config.single.ts.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    // the sandbox preview serves the dev server from a generated *.e2b.app host
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // The art chunk is intentionally large: it is one cached data blob, not code
    // (per-file artwork lands with the image-pipeline change). Anything that grows
    // past 1 MB is worth a look.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            // the game engine, once it lands, must stay in its own lazily fetched chunk
            if (id.includes("/src/play/")) return "engine";
            // car sprites + paints: big, rarely edited, cached on their own
            if (id.includes("/src/assets/")) return "art";
            return;
          }
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
          return "vendor";
        },
      },
    },
  },
});
