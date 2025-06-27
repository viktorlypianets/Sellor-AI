import React from "react";
import ReactDOM from "react-dom/client";
import ChatWidget from "./components/ChatWidget";
import "./App.css";

// Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("smartask-widget-root-1");

  if (!rootEl) {
    console.error("❌ smartask-widget-root not found in DOM");
    return;
  }

  if (!window.SmartAskConfig) {
    console.error("❌ SmartAskConfig missing");
    return;
  }

  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <div className="app">
        <ChatWidget config={window.SmartAskConfig} />
      </div>
    </React.StrictMode>
  );
});
