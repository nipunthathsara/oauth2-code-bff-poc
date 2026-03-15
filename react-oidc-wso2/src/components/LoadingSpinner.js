import React from "react";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="page-center">
      <div className="card" style={{ textAlign: "center" }}>
        <div className="spinner-lg" />
        <p className="subtitle" style={{ marginTop: 20 }}>{message}</p>
      </div>
    </div>
  );
}
