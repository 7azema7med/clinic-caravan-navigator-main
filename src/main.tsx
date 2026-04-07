import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./index.css";

// Hide the CSS splash screen once React is ready
const hideSplash = () => {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 600);
  }
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Fatal: #root element not found in DOM. Check index.html.");
}

const root = createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Hide splash after React finishes first render
requestAnimationFrame(() => {
  requestAnimationFrame(hideSplash);
});
