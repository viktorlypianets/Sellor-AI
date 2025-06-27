import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../style/container.css";
import "../style/generate.css";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function ReviewCard({ index, id, r }) {
  const textareaRef = useRef(null);
  const [scheduled, setScheduled] = useState(false);
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(r);
  const [loading, setLoading] = useState(false);

  const toneArray = ["friendly", "empathetic", "bold"];
  const bgArray = ["bg-blue", "bg-pink", "bg-purple"];

  const handleRefreshSubmit = async () => {
    try {
      setLoading(true);
      let response = await axios.post(`${backendURL}/api/regenerate`, {
        sentiment: text,
      });
      setText(response.data);
      setLoading(false);
      console.log("Response from backend:", response.data);
    } catch (error) {
      console.error("Error fetching repli data:", error);
    }
  };

  const handleApprovePost = async () => {
    try {
      let response = await axios.post(`${backendURL}/api/approve`, {
        reviewId: id,
        reply: text,
      });
      console.log(response.data);
      if (response.data.success) {
        alert("Reply created successfully!");
      } else {
        alert(response.data.message.error);
      }
      console.log("Response from backend:", response.data);
    } catch (error) {
      console.error("Error approve repli data:", error);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [text, edit]);

  return (
    <div style={{ flex: 1 }} key={index}>
      <div className={`${bgArray[index]}`}></div>
      <div className={`response-header-${bgArray[index]}`}>
        {toneArray[index]}
      </div>
      <div className="response-card" key={index}>
        <textarea
          ref={textareaRef}
          value={text}
          readOnly={!edit}
          onClick={() => setEdit(true)}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setEdit(false)}
          rows={1}
          style={{
            width: "100%",
            resize: "none",
            border: edit ? "1px solid #ccc" : "none",
            background: edit ? "#fff" : "transparent",
            fontSize: "16px",
            overflow: "hidden",
            outline: "none",
            padding: 0,
            cursor: edit ? "text" : "pointer",
          }}
          className="response-text"
        />
        <div className="response-actions">
          <button
            className="icon-btn"
            style={{ color: loading ? "red" : "blue" }}
            onClick={handleRefreshSubmit}
          >
            ↻
          </button>
          <button className="icon-btn" onClick={() => setEdit(true)}>
            ✎
          </button>
        </div>
        <button className="btn-primary" onClick={handleApprovePost}>
          Approve & Post
        </button>
        <div className="schedule-wrapper">
          <button
            className="schedule-toggle"
            onClick={() => setScheduled(!scheduled)}
          >
            Schedule Reply ⌄
          </button>
          {scheduled && (
            <div className="schedule-fields">
              <input type="date" defaultValue="2025-04-15" />
              <input type="time" defaultValue="08:00" />
              <button className="btn-schedule">Schedule</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
