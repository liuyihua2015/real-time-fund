import React from "react";

export default function Stat({ label, value, delta }) {
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "";
  return (
    <div
      className="stat"
      style={{ flexDirection: "column", gap: 4, minWidth: 0 }}
    >
      <span
        className="label"
        style={{
          fontSize: "11px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      <span
        className={`value ${dir}`}
        style={{ fontSize: "15px", lineHeight: 1.2, whiteSpace: "nowrap" }}
      >
        {value}
      </span>
    </div>
  );
}
