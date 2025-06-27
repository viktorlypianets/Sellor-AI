import React, { useEffect, useState } from "react";
import axios from "axios";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function MostViewed() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${backendURL}/api/faq/most/11983984-dbe5-47b6-9c17-525195af3291`)
      .then((res) => {
        if (res.data.success) {
          setQuestions(res.data.data.slice(0, 5).reverse()); // Top 5
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="card" style={{ marginTop: "20px" }}>
      <h3>❓ Top 5 Most Viewed Questions</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Question</th>
              <th style={{ width: 100, textAlign: "center" }}>Views</th>
              <th style={{ width: 120, textAlign: "center" }}>Post Date</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}.</td>
                <td>{item.question}</td>
                <td style={{ textAlign: "center" }}>
                  <span role="img" aria-label="views">
                    👁️
                  </span>{" "}
                  {item.view ?? 0}
                </td>
                <td style={{ textAlign: "center" }}>
                  {formatDate(item.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
