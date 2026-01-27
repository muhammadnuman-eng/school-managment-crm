
  import { createRoot } from "react-dom/client";
  import { AppRouter } from "./routes/AppRouter.tsx";
  import "./index.css";

  // Suppress browser extension errors (not from our code)
  window.addEventListener('error', (event) => {
    if (event.message?.includes('message channel') || event.message?.includes('enable_copy')) {
      event.preventDefault();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || String(event.reason || '');
    if (errorMessage.includes('message channel') || errorMessage.includes('enable_copy')) {
      event.preventDefault();
      return false;
    }
  });

  createRoot(document.getElementById("root")!).render(<AppRouter />);
  