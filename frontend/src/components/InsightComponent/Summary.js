import React, { useEffect, useState } from "react";
import axios from "axios";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function Summary() {
  const [faqViews, setFaqViews] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState(0);
  const [bonuceRate, setBonuceRate] = useState(0);

  useEffect(() => {
    axios
      .get(
        backendURL + `/api/faq/insights/${localStorage.getItem("product_id")}`
      )
      .then((res) => {
        let response = res.data;
        if (response.success) {
          setFaqViews(response.data);
        }
      });

    axios.get(backendURL + `/api/chat/open`).then((res) => {
      let response = res.data;
      if (response.success) {
        setBonuceRate(response.data.rate * 100);
      }
    });
  }, []);

  return (
    <div className="card1">
      <h2 className="Titletable">Insights</h2>
      <div className="card-content">
        <div className="card-item">
          <p>FAQ Views: </p>
          <p>{faqViews}</p>
        </div>
        <div className="card-item">
          <p>Missed Questions: </p>
          <p>{missedQuestions}</p>
        </div>
        <div className="card-item">
          <p>Bonuce Rate: </p>
          <p>{bonuceRate}%</p>
        </div>
      </div>
    </div>
  );
}
