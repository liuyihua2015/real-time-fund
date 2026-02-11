import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import CountUp from "./ui/CountUp";

export default function GroupSummary({ funds, holdings, groupName, getProfit }) {
  const [showPercent, setShowPercent] = useState(true);
  const rowRef = useRef(null);
  const [assetSize, setAssetSize] = useState(24);
  const [metricSize, setMetricSize] = useState(18);
  const [winW, setWinW] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWinW(window.innerWidth);
      const onR = () => setWinW(window.innerWidth);
      window.addEventListener("resize", onR);
      return () => window.removeEventListener("resize", onR);
    }
  }, []);

  const summary = useMemo(() => {
    let totalAsset = 0;
    let totalProfitToday = 0;
    let totalProfitYesterday = 0;
    let totalHoldingReturn = 0;
    let totalCost = 0;
    let hasHolding = false;
    let hasProfitYesterday = false;

    funds.forEach((fund) => {
      const holding = holdings[fund.code];
      const profit = getProfit(fund, holding);

      if (profit) {
        hasHolding = true;
        totalAsset += profit.amount;
        if (typeof profit.profitToday === "number")
          totalProfitToday += profit.profitToday;
        if (typeof profit.profitYesterday === "number") {
          totalProfitYesterday += profit.profitYesterday;
          hasProfitYesterday = true;
        }
        if (profit.profitTotal !== null) {
          totalHoldingReturn += profit.profitTotal;
          if (holding && typeof holding.share === "number") {
            if (typeof holding.costAmount === "number") {
              totalCost += holding.costAmount;
            } else if (typeof holding.cost === "number") {
              totalCost += holding.cost * holding.share;
            }
          }
        }
      }
    });

    const returnRate =
      totalCost > 0 ? (totalHoldingReturn / totalCost) * 100 : 0;

    return {
      totalAsset,
      totalProfitToday,
      totalProfitYesterday,
      totalHoldingReturn,
      hasHolding,
      hasProfitYesterday,
      returnRate,
    };
  }, [funds, holdings, getProfit]);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const height = el.clientHeight;
    // 使用 80px 作为更严格的阈值，因为 margin/padding 可能导致实际占用更高
    const tooTall = height > 80;
    if (tooTall) {
      setAssetSize((s) => Math.max(16, s - 1));
      setMetricSize((s) => Math.max(12, s - 1));
    } else {
      // 如果高度正常，尝试适当恢复字体大小，但不要超过初始值
      // 这里的逻辑可以优化：如果当前远小于阈值，可以尝试增大，但为了稳定性，主要处理缩小的场景
      // 或者：如果高度非常小（例如远小于80），可以尝试+1，但要小心死循环
    }
  }, [
    winW,
    summary.totalAsset,
    summary.totalProfitToday,
    summary.totalProfitYesterday,
    summary.totalHoldingReturn,
    summary.returnRate,
    showPercent,
    assetSize,
    metricSize,
  ]); // 添加 assetSize, metricSize 到依赖，确保逐步缩小生效

  if (!summary.hasHolding) return null;

  return (
    <div
      className="glass card"
      style={{
        marginBottom: 16,
        padding: "16px 20px",
        background: "rgba(255, 255, 255, 0.03)",
      }}
    >
      <div
        ref={rowRef}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div>
          <div className="muted" style={{ fontSize: "12px", marginBottom: 4 }}>
            总金额(元)
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            <CountUp
              value={summary.totalAsset}
              style={{ fontSize: assetSize }}
            />
          </div>
          {groupName ? (
            <div className="muted" style={{ fontSize: "12px", marginTop: 2 }}>
              {groupName}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              winW <= 640
                ? "repeat(2, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div className="stat" style={{ flexDirection: "column", gap: 4 }}>
            <span className="label">今日收益</span>
            <span
              className={`value ${summary.totalProfitToday > 0 ? "up" : summary.totalProfitToday < 0 ? "down" : ""}`}
              data-metric="groupProfitToday"
              data-testid="group-profit-today"
              data-value={summary.totalProfitToday}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span style={{ marginRight: 1 }}>
                {summary.totalProfitToday > 0
                  ? "+"
                  : summary.totalProfitToday < 0
                    ? "-"
                    : ""}
              </span>
              <CountUp
                value={Math.abs(summary.totalProfitToday)}
                style={{ fontSize: metricSize }}
              />
            </span>
          </div>

          <div className="stat" style={{ flexDirection: "column", gap: 4 }}>
            <span className="label">昨日收益</span>
            {summary.hasProfitYesterday ? (
              <span
                className={`value ${summary.totalProfitYesterday > 0 ? "up" : summary.totalProfitYesterday < 0 ? "down" : ""}`}
                data-metric="groupProfitYesterday"
                data-testid="group-profit-yesterday"
                data-value={summary.totalProfitYesterday}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span style={{ marginRight: 1 }}>
                  {summary.totalProfitYesterday > 0
                    ? "+"
                    : summary.totalProfitYesterday < 0
                      ? "-"
                      : ""}
                </span>
                <CountUp
                  value={Math.abs(summary.totalProfitYesterday)}
                  style={{ fontSize: metricSize }}
                />
              </span>
            ) : (
              <span className="value muted">—</span>
            )}
          </div>

          <div className="stat" style={{ flexDirection: "column", gap: 4 }}>
            <span className="label">持有收益</span>
            <span
              className={`value ${summary.totalHoldingReturn > 0 ? "up" : summary.totalHoldingReturn < 0 ? "down" : ""}`}
              data-metric="groupProfitTotal"
              data-testid="group-profit-total"
              data-value={summary.totalHoldingReturn}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span style={{ marginRight: 1 }}>
                {summary.totalHoldingReturn > 0
                  ? "+"
                  : summary.totalHoldingReturn < 0
                    ? "-"
                    : ""}
              </span>
              <CountUp
                value={Math.abs(summary.totalHoldingReturn)}
                style={{ fontSize: metricSize }}
              />
            </span>
          </div>

          <div className="stat" style={{ flexDirection: "column", gap: 4 }}>
            <span className="label">持有收益率</span>
            <span
              className={`value ${summary.returnRate > 0 ? "up" : summary.returnRate < 0 ? "down" : ""}`}
              data-metric="groupReturnRate"
              data-testid="group-return-rate"
              data-value={summary.returnRate}
              style={{ fontFamily: "var(--font-mono)", cursor: "pointer" }}
              onClick={() => setShowPercent(!showPercent)}
              title="点击切换显示/隐藏百分号"
            >
              <span style={{ marginRight: 1 }}>
                {summary.returnRate > 0
                  ? "+"
                  : summary.returnRate < 0
                    ? "-"
                    : ""}
              </span>
              <CountUp
                value={Math.abs(summary.returnRate)}
                suffix={showPercent ? "%" : ""}
                style={{ fontSize: metricSize }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
