import React from 'react';

export default function ReviewInsights() {
  return (
    <div className="card">
      <h2>Review Insights</h2>

      <h3>Positive Reviews</h3>
      <table className="table">
        <thead>
          <tr><th>Name</th><th>Review</th><th>Product ID</th></tr>
        </thead>
        <tbody>
          <tr><td>Maria</td><td>Loved the product</td><td>PID_32145</td></tr>
          <tr><td>Steve</td><td>Liked the color</td><td>PID_32145</td></tr>
          <tr><td>John</td><td>Material is good</td><td>PID_36195</td></tr>
          <tr><td>Nick</td><td>Affordable product</td><td>PID_32145</td></tr>
        </tbody>
      </table>

      <h3>Negative Reviews</h3>
      <table className="table">
        <thead><tr><th>Name</th><th>Review</th><th>Product ID</th></tr></thead>
        <tbody>
          <tr><td>Sue</td><td>Late delivery</td><td>PID_32145</td></tr>
        </tbody>
      </table>
    </div>
  );
}
