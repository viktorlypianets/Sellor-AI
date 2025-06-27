import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import { toast } from "react-toastify";

const backendURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const downloadCSV = (csvString, filename = "data.csv") => {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Unanswerd() {
  const [unanswered, setUnanswered] = useState([]);

  const handleDownload = () => {
    const csv = Papa.unparse(unanswered); // Convert JSON to CSV
    downloadCSV(csv, "users.csv");
  };

  useEffect(() => {
    const fetchMissedQuestions = async () => {
      try {
        const res = await axios.get(
          backendURL +
            `/api/admin/unanswered/${localStorage.getItem("product_id")}`
        );
        let response = res.data;
        if (response.success) {
          console.log(
            "Unanswered questions fetched successfully",
            response.data
          );
          setUnanswered(response.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchMissedQuestions();
  }, []);

  useEffect(() => {
    if (unanswered.length > 0) {
      console.log("unanswered", unanswered);
      toast.success("Unanswered questions fetched successfully");
    }
  }, [unanswered]);

  return (
    <div className="card" style={{ marginTop: "20px" }}>
      {unanswered.length === 0 ? (
        <div>Loading...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Chatbot Response</th>
              <th>Product ID</th>
            </tr>
          </thead>
          <tbody>
            {(Array.isArray(unanswered) ? unanswered : []).map((item, idx) => (
              <tr key={idx}>
                <td>{item?.question || "-"}</td>
                <td>{item?.answer || "-"}</td>
                <td>{item?.product_id || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={handleDownload} className="download-button">
        Download CSV{" "}
      </button>
    </div>
  );
}
