import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";

document.addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("smartask-widget-root");

  if (!rootEl) {
    console.error("SmartAsk root element not found");
    return;
  }

  if (!window.SmartAskConfig) {
    console.error("SmartAskConfig not found");
    return;
  }

  rootEl.innerHTML = "";
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App config={window.SmartAskConfig} />);
});
