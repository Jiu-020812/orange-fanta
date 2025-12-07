import React from "react";

export default function DeleteButton({ onClick, children = "삭제" }) {
    return (
      <button
        onClick={onClick}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          borderRadius: 999,
          border: "1px solid #f87171",
          backgroundColor: "transparent",
          color: "#fca5a5",
          cursor: "pointer",
        }}
      >
        {children}
      </button>
    );
  }