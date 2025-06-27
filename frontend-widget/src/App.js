import "./App.css";
import ChatWidget from "./components/ChatWidget";

function App({ config }) {
  // If config is provided, pass it to ChatWidget; otherwise, render default
  return (
    <div
      className="App"
      style={{
        position: "fixed",
        bottom: "100px",
        right: "20px",
        zIndex: "100",
      }}
    >
      <ChatWidget config={config} />
    </div>
  );
}

export default App;
