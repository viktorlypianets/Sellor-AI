import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, UserIcon, X, ChevronRight, Mic } from "lucide-react";
import Avatar from "./Avatar";
import "./ChatWidget.css";

const ChatBubble = ({ from, text }) => {
  const isUser = from === "user";
  return (
    <>
      <div className={`chat-bubble-container ${isUser ? "user" : "bot"}`}>
        {!isUser && <MessageSquare className="icon" />}
        <div className={`chat-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
          {text}
        </div>
        {isUser && <UserIcon className="icon user-icon" />}
      </div>
    </>
  );
};

const SuggestedQuestions = ({ questions, onSelect }) => (
  <div className="suggested-questions">
    {questions.map((q, i) => (
      <button
        key={i}
        onClick={() => onSelect(q.id, q.answer, q.question)}
        className="suggested-button"
      >
        {q.question}
      </button>
    ))}
  </div>
);

export default function ChatWidget({ config }) {
  const recognitionRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const backedendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
  const productId = config.productId;

  const customerId = config.customerId || null;

  console.log("Config:", config);
  console.log("Product ID:", productId);
  console.log("Customer ID:", customerId);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState(null);
  const [showAvatar, setShowAvatar] = useState(false);
  const chatCardRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceSubmit(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleVoiceSubmit = async (text) => {
    const newMessages = [...messages, { from: "user", text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await axios.post(`${backedendUrl}/api/chat/message`, {
        sessionId: localStorage.getItem("sessionId"),
        message: text,
      });

      setLoading(false);
      if (res.data.success) {
        const reply = res.data.data.answer;
        setMessages((prev) => [...prev, { from: "bot", text: reply }]);
        speakText(reply);

        // Handle avatar video if available
        if (res.data.data.videoUrl) {
          setAvatarVideoUrl(res.data.data.videoUrl);
          setShowAvatar(true);
        }
      }
    } catch (err) {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, something went wrong." },
      ]);
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  };

  const handleAvatarVideoEnd = () => {
    setShowAvatar(false);
    setAvatarVideoUrl(null);
  };

  useEffect(() => {
    let session = localStorage.getItem("sessionId");
    if (!session) {
      const sessionData = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      axios
        .post(`${backedendUrl}/api/chat/session`, {
          productId: productId,
          customerId: customerId,
          session_data: sessionData,
        })
        .then((res) => {
          console.log("result:", res.data);
          if (res.data.success && res.data.data[0]?.id) {
            localStorage.setItem("sessionId", res.data.data[0].id);
          } else {
            console.error("Failed to create session");
          }
        })
        .catch((err) => {
          console.error("Error creating session: ", err);
        });
    }
    const userLang = navigator.language || navigator.userLanguage;
    console.log("Browser language:", userLang);
    axios
      .get(`${backedendUrl}/api/faq/all`, {
        params: { product_id: productId, lang: userLang.slice(0, 2) },
      })
      .then((res) => {
        if (res.data.success) {
          setSuggestedQuestions(res.data.data);
        } else {
          console.error("Failed to fetch suggested questions");
        }
      })
      .catch((err) => {
        console.error("Error fetching suggested questions: ", err);
      });
  }, [productId]);

  useEffect(() => {
    if (!showChat) return;

    const handleClickOutside = (event) => {
      if (chatCardRef.current && !chatCardRef.current.contains(event.target)) {
        setShowChat(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showChat]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true); // Start loading

    try {
      const res = await axios.post(`${backedendUrl}/api/chat/message`, {
        sessionId: localStorage.getItem("sessionId"),
        message: input,
      });
      setLoading(false); // Stop loading
      console.log("Response: ", res.data);
      if (res.data.success) {
        setMessages([
          ...newMessages,
          { from: "bot", text: res.data.data.answer },
        ]);

        // Handle avatar video if available
        if (res.data.data.videoUrl) {
          setAvatarVideoUrl(res.data.data.videoUrl);
          setShowAvatar(true);
        }
      }
    } catch (err) {
      setLoading(false); // Stop loading
      setMessages([
        ...newMessages,
        { from: "bot", text: "Sorry, something went wrong." },
      ]);
    }
  };

  const handleSuggested = async (id, answer, question) => {
    const res = await axios.get(`${backedendUrl}/api/faq/viewed/${id}`);

    if (res.data.success) {
      const newMessages = [
        ...messages,
        { from: "user", text: question },
        { from: "bot", text: answer },
      ];
      setMessages(newMessages);
      setInput("");

      // For suggested questions, we don't have video URLs, so we don't show avatar
      // The avatar is only shown for AI-generated responses
    }
  };

  return (
    <>
      <style>
        {`
.dot-loader {
  display: flex;
  align-items: center;
  height: 32px;
  margin: 8px 0;
}

.dot {
  width: 8px;
  height: 8px;
  margin: 0 2px;
  border-radius: 50%;
  background: #a855f7;
  animation: dot-bounce 1.2s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dot-bounce {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  40% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.chat-card {
  width: 380px;
  height: 500px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  font-family: sans-serif;
  background-color: white;
  margin-bottom: 20px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: black;
  color: white;
  padding: 10px;
  font-size: 18px;
  font-weight: 600;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.chat-input-container {
  display: flex;
  border-top: 1px solid #e0e0e0;
  padding: 8px;
}

.chat-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
}

.send-button {
  background: black;
  color: white;
  border: none;
  padding: 8px;
  border-radius: 8px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-bubble-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.chat-bubble-container.user {
  justify-content: flex-end;
  flex-direction: row-reverse;
}

.chat-bubble-container.bot {
  justify-content: flex-start;
}

.chat-bubble {
  padding: 8px 12px;
  border-radius: 20px;
  max-width: 80%;
  font-size: 14px;
}

.bot-bubble {
  background-color: #f3f4f6;
  color: black;
}

.user-bubble {
  background-color: #e5e7eb;
}

.icon {
  width: 18px;
  height: 18px;
}

.user-icon {
  color: #a855f7;
}

.suggested-title {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.suggested-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.suggested-button {
  background-color: #f3f4f6;
  border: none;
  border-radius: 9999px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}

.suggested-button:hover {
  background-color: #e5e7eb;
}

.chat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 200px;
  background-color: #111111;
  border-radius: 30px;
}

.chat-text {
  font-size: 16px;
  font-weight: 1000;
  color: white;
}

.send-button.recording {
  background-color: #ff4d4d;
  color: white;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

        `}
      </style>
      <div
        style={{
          position: "fixed",
          bottom: "100px",
          right: "20px",
          zIndex: "100",
        }}
      >
        <Avatar
          videoUrl={avatarVideoUrl}
          isVisible={showAvatar}
          onVideoEnd={handleAvatarVideoEnd}
        />
        {!showChat && (
          <div className="chat-button" onClick={() => setShowChat(true)}>
            <MessageSquare className="chat-icon" color="white" />
            <p className="chat-text">Ask a Question</p>
          </div>
        )}
        {showChat && (
          <div className="chat-card" ref={chatCardRef}>
            <div className="chat-header">
              <p>Chat with Us</p>
              <X
                strokeWidth={3}
                onClick={() => setShowChat(false)}
                style={{ cursor: "pointer" }}
              />
            </div>
            <div className="chat-content">
              {messages.map((msg, idx) => (
                <ChatBubble key={idx} from={msg.from} text={msg.text} />
              ))}
              {loading && (
                <div className="dot-loader">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              )}
              {messages.length === 0 && suggestedQuestions.length > 0 && (
                <>
                  <p className="suggested-title">Suggested Questions:</p>
                  <SuggestedQuestions
                    questions={suggestedQuestions}
                    onSelect={handleSuggested}
                  />
                </>
              )}
            </div>
            <div className="chat-input-container">
              <input
                className="chat-input"
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />

              {/* Record Button (Mic) */}
              <button
                className={`send-button ${isRecording ? "recording" : ""}`}
                onMouseDown={() => {
                  if (recognitionRef.current) {
                    recognitionRef.current.start();
                    setIsRecording(true);
                  }
                }}
                onMouseUp={() => {
                  if (recognitionRef.current && isRecording) {
                    recognitionRef.current.stop();
                    setIsRecording(false);
                  }
                }}
                title="Hold to Record"
              >
                <Mic strokeWidth={2.5} />
              </button>

              {/* Send Button */}
              <button className="send-button" onClick={handleSend}>
                <ChevronRight strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
