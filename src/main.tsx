import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

/**
 * After a deploy, a tab that is still running the previous build may ask for a
 * panel chunk whose hashed filename no longer exists. Vite reports that as a
 * `vite:preloadError`; without this the panel would stay broken until a manual
 * reload. Reload once (rate-limited so a genuinely broken chunk cannot loop)
 * to pick up the fresh index.html.
 */
window.addEventListener("vite:preloadError", () => {
  const key = "hc_chunk_reload";
  const last = Number(sessionStorage.getItem(key) ?? 0);
  if (Date.now() - last < 10_000) return;
  sessionStorage.setItem(key, String(Date.now()));
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
