import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent the default behavior of showing the error in console
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
