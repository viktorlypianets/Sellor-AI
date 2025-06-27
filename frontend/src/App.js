import React from "react";
import ReactDOM from "react-dom/client";
import Chatbot from "./components/Chatbot";
import InstallButton from "./components/InstallButton";
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>SmartAsk Chatbot</h1>
      </header>
      <main className="app-main">
        <Chatbot config={window.SmartAskConfig} />
        <InstallButton />
      </main>
      <footer className="app-footer">
        <p>&copy; 2023 SmartAsk. All rights reserved.</p>
      </footer>
    </div>
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
