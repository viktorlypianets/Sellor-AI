import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FAQManagementDashboard from "../components/FAQManagementDashboard";
import ChatbotSettings from "../components/ChatbotSettings";
import Insights from "../components/Insights";

export default function Customer() {
  const [activeTab, setActiveTab] = useState("FAQ");
  const navigate = useNavigate();
  return (
    <div>
      <div className="navbar">
        <button
          className={activeTab === "FAQ" ? "active" : ""}
          onClick={() => setActiveTab("FAQ")}
        >
          📄 FAQ
        </button>
        <button
          className={activeTab === "Chatbot" ? "active" : ""}
          onClick={() => setActiveTab("Chatbot")}
        >
          🤖 Chatbot Settings
        </button>
        <button
          className={activeTab === "Insights" ? "active" : ""}
          onClick={() => setActiveTab("Insights")}
        >
          📊 Insights
        </button>
        <button
          className={activeTab === "Review" ? "active" : ""}
          onClick={() => navigate("/")}
        >
          📤Log out
        </button>
      </div>
      <div className="container">
        {activeTab === "FAQ" && <FAQManagementDashboard />}
        {activeTab === "Chatbot" && <ChatbotSettings />}
        {activeTab === "Insights" && <Insights />}
      </div>
    </div>
  );
}
