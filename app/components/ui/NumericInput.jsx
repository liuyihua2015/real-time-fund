import React from "react";
import { PlusIcon, MinusIcon } from "../Icons";

export default function NumericInput({
  value,
  onChange,
  step = 1,
  min = 0,
  placeholder,
}) {
  const decimals = String(step).includes(".")
    ? String(step).split(".")[1].length
    : 0;
  const fmt = (n) => Number(n).toFixed(decimals);
  const inc = () => {
    const v = parseFloat(value);
    const base = isNaN(v) ? 0 : v;
    const next = base + step;
    onChange(fmt(next));
  };
  const dec = () => {
    const v = parseFloat(value);
    const base = isNaN(v) ? 0 : v;
    const next = Math.max(min, base - step);
    onChange(fmt(next));
  };
  return (
    <div style={{ position: "relative" }}>
      <input
        type="number"
        step="any"
        className="input no-zoom" // 增加 no-zoom 类
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", paddingRight: 56 }}
      />
      <div
        style={{
          position: "absolute",
          right: 6,
          top: 6,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          className="icon-button"
          type="button"
          onClick={inc}
          style={{ width: 44, height: 16, padding: 0 }}
        >
          <PlusIcon width="14" height="14" />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={dec}
          style={{ width: 44, height: 16, padding: 0 }}
        >
          <MinusIcon width="14" height="14" />
        </button>
      </div>
    </div>
  );
}
