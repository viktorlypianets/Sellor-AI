import React from "react";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteFaq, fetchFaq, updateFaqs } from "../store/faqSlice";
import { useNavigate, useParams } from "react-router-dom";

import "../style/faqManagement.css";

export default function FAQManagementDashboard() {
  const { items, status, error } = useSelector((state) => state.faqs);
  const dispatch = useDispatch();
  const { id } = useParams();

  const [editIdx, setEditIdx] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  useEffect(() => {
    dispatch(fetchFaq(id));
  }, [dispatch, id]);

  const updateFaq = (data) => {
    console.log("updateFaq", data);
    dispatch(updateFaqs(data));
  };

  const handleEditClick = (faq, idx) => {
    setEditIdx(idx);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const handleSaveClick = (faq) => {
    updateFaq({
      id: faq.id,
      question: editQuestion,
      answer: editAnswer,
      is_approved: faq.is_approved,
    });
    setEditIdx(null);
  };

  return (
    <div className="card">
      <h2 className="Titletable">FAQ Management Dashboard</h2>
      <table className="tableTitle">
        <thead>
          <tr>
            <th style={{ width: "20%" }}>FAQ</th>
            <th style={{ width: "60%" }}>Suggested Answer</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((faq, idx) => (
            <tr key={idx}>
              <td>
                {editIdx === idx ? (
                  <input
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    style={{ width: "95%" }}
                  />
                ) : (
                  faq.question
                )}
              </td>
              <td>
                {editIdx === idx ? (
                  <input
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    style={{ width: "95%" }}
                  />
                ) : (
                  faq.answer
                )}
              </td>
              <td>
                <button
                  className="approve"
                  style={{
                    backgroundColor: faq.is_approved ? "#007bff" : "#dc3545", // blue if approved, red if not
                    color: "#fff",
                  }}
                  onClick={() =>
                    updateFaq({
                      id: faq.id,
                      question: faq.question,
                      answer: faq.answer,
                      is_approved: !faq.is_approved,
                    })
                  }
                >
                  {faq.is_approved ? "Approved" : "Approve"}
                </button>
                {editIdx === idx ? (
                  <button className="edit" onClick={() => handleSaveClick(faq)}>
                    Save
                  </button>
                ) : (
                  <button
                    className="edit"
                    onClick={() => handleEditClick(faq, idx)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="delete"
                  onClick={() => dispatch(deleteFaq(faq.id))}
                  disabled={editIdx === idx}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
