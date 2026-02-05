import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Default to the light theme to match the reference layout.
// (Later you can toggle themes by swapping "light" / "dark" on <html>.)
document.documentElement.classList.add("light");

createRoot(document.getElementById("root")!).render(<App />);
