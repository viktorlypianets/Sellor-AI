import React from "react";
import Chatbot from "./components/Chatbot";
import InstallButton from "./components/InstallButton";
import "./App.css";

function App() {
  return React.createElement(
    React.createElement(Chatbot)
    // React.createElement(InstallButton)
  );
}

export default App;
