import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize CSRF token on app load
async function initCSRFToken() {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include" });
    const csrfToken = response.headers.get("X-CSRF-Token");
    if (csrfToken) {
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) {
        metaTag.setAttribute("content", csrfToken);
      }
    }
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);
  }
}

initCSRFToken().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});

