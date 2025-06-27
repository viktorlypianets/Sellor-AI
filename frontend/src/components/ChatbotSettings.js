import React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { updateWidgets } from "../store/widgetSlice";
import { useDispatch } from "react-redux";

export default function ChatbotSettings() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const [position, setPosition] = useState("bottom-right");
  const [tone, setTone] = useState("professional");
  const [color_theme, setcolor_theme] = useState("Blue");
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="chatbot-settings" style={{ width: "100%" }}>
      <div className="card">
        <h2 className="Titletable">Chatbot Settings</h2>
        <div style={{ padding: "0px 10px" }}>
          <label>Enable Chatbot</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => setEnabled((v) => !v)}
            />
            <span className="toggle-slider"></span>
          </label>
          <br />
          <br />

          <label>Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-right">Bottom Right</option>
          </select>

          <label>Personality Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="professional">Professional</option>
            <option value="witty">Witty</option>
            <option value="empathetic">Empathetic</option>
          </select>

          <label>Styling</label>
          <select
            value={color_theme}
            onChange={(e) => setcolor_theme(e.target.value)}
          >
            <option value="Blue">
              <span className="color-dot blue"></span>Blue
            </option>
            <option value="Purple">
              <span className="color-dot purple"></span>Purple
            </option>
            <option value="Gray">
              <span className="color-dot gray"></span>Gray
            </option>
          </select>

          <button
            onClick={() =>
              dispatch(
                updateWidgets({
                  id: localStorage.getItem("store_id"),
                  position,
                  color_theme,
                  tone,
                })
              )
            }
          >
            send
          </button>
        </div>
      </div>
      <div className="content">
        <div>Preview</div>
        <div
          style={{
            marginTop: "20px",
            marginLeft: "30px",
            padding: "10px",
            background: "#000",
            color: "#fff",
            borderRadius: "20px",
            display: "inline-block",
          }}
        >
          <span role="img" aria-label="chat">
            💬
          </span>{" "}
          Ask a Question
        </div>
      </div>
    </div>
  );
}
