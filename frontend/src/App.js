import React from "react";
import ReactDOM from "react-dom/client";
import Chatbot from "./components/Chatbot";
import InstallButton from "./components/InstallButton";
import "./App.css";

function App() {
  return React.createElement(
    Chatbot,
    React.createElement(InstallButton)
    // React.createElement(InstallButton)
  );
}

// Wait for DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("smartask-widget-root");
  if (!rootEl) {
    console.error(":x: smartask-widget-root not found in DOM");
    return;
  }
  if (!window.SmartAskConfig) {
    console.error(":x: SmartAskConfig missing");
    return;
  }
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <div className="app">
        <Chatbot config={window.SmartAskConfig} />
      </div>
    </React.StrictMode>
  );
});

export default App;
