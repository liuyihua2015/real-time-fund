import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarIcon } from "../Icons";

export default function DatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() =>
    value ? new Date(value) : new Date(),
  );

  // 点击外部关闭
  useEffect(() => {
    const close = () => setIsOpen(false);
    if (isOpen) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [isOpen]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-11

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleSelect = (e, day) => {
    e.stopPropagation();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // 检查是否是未来日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr);

    if (selectedDate > today) return; // 禁止选择未来日期

    onChange(dateStr);
    setIsOpen(false);
  };

  // 生成日历数据
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0(Sun)-6(Sat)

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div
      className="date-picker"
      style={{ position: "relative" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="input-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          height: "40px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "8px",
          cursor: "pointer",
          border: "1px solid transparent",
          transition: "all 0.2s",
        }}
      >
        <span>{value || "选择日期"}</span>
        <CalendarIcon width="16" height="16" className="muted" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="glass card"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              marginTop: 8,
              padding: 12,
              zIndex: 10,
              background: "rgba(30, 41, 59, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="calendar-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <button
                onClick={handlePrevMonth}
                className="icon-button"
                style={{ width: 24, height: 24 }}
              >
                &lt;
              </button>
              <span style={{ fontWeight: 600 }}>
                {year}年 {month + 1}月
              </span>
              <button
                onClick={handleNextMonth}
                className="icon-button"
                style={{ width: 24, height: 24 }}
                // 如果下个月已经是未来，可以禁用（可选，这里简单起见不禁用翻页，只禁用日期点击）
              >
                &gt;
              </button>
            </div>

            <div
              className="calendar-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                textAlign: "center",
              }}
            >
              {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                <div
                  key={d}
                  className="muted"
                  style={{ fontSize: "12px", marginBottom: 4 }}
                >
                  {d}
                </div>
              ))}
              {days.map((d, i) => {
                if (!d) return <div key={i} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isSelected = value === dateStr;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const current = new Date(dateStr);
                const isToday = current.getTime() === today.getTime();
                const isFuture = current > today;

                return (
                  <div
                    key={i}
                    onClick={(e) => !isFuture && handleSelect(e, d)}
                    style={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      borderRadius: "6px",
                      cursor: isFuture ? "not-allowed" : "pointer",
                      background: isSelected
                        ? "var(--primary)"
                        : isToday
                          ? "rgba(255,255,255,0.1)"
                          : "transparent",
                      color: isFuture
                        ? "var(--muted)"
                        : isSelected
                          ? "#000"
                          : "var(--text)",
                      fontWeight: isSelected || isToday ? 600 : 400,
                      opacity: isFuture ? 0.3 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isFuture)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isFuture)
                        e.currentTarget.style.background = isToday
                          ? "rgba(255,255,255,0.1)"
                          : "transparent";
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
