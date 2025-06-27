import React, { useEffect, useState } from "react";
import axios from "axios";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function WeeklyTrend() {
  const [weekData, setWeekData] = useState({
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${backendURL}/api/faq/weekly/11983984-dbe5-47b6-9c17-525195af3291`)
      .then((res) => {
        if (res.data.success) {
          setWeekData(res.data.data.week);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...days.map((d) => weekData[d] || 0), 1);

  if (loading) return <div>Loading weekly trend...</div>;

  return (
    <div style={{ width: "100%", marginTop: 24 }}>
      <h3>📈 Weekly Trend (FAQs Viewed)</h3>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          height: 120,
          gap: 16,
          marginBottom: 16,
        }}
      >
        {days.map((day) => (
          <div key={day} style={{ textAlign: "center", flex: 1 }}>
            <div
              style={{
                background: "#0078d4",
                height: `${(weekData[day] / max) * 100 || 2}%`,
                minHeight: 2,
                borderRadius: 4,
                transition: "height 0.3s",
                marginBottom: 8,
              }}
              title={weekData[day]}
            />
            <div style={{ fontSize: 12, color: "#333" }}>{day}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{weekData[day]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
