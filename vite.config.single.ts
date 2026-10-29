import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * The "one self-contained index.html" build, kept for demos / offline sharing.
 *
 * It is NOT the shipping build: everything (code, styles, sprites) is inlined
 * into a single document, so nothing can be fetched later, cached separately or
 * streamed — that is why `npm run build` uses the split config instead.
 *
 *   npm run build:single  ->  dist-single/index.html
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist-single",
    emptyOutDir: true,
  },
});
