import React from "react";
import { motion } from "framer-motion";
import { ExitIcon, StarIcon, SettingsIcon, TrashIcon } from "../Icons";
import { isYmdAfter } from "../../lib/dateUtils";

function pickUpDownClass(n) {
  if (!Number.isFinite(n) || n === 0) return "";
  return n > 0 ? "up" : "down";
}

function formatMoneyAbs(n) {
  if (!Number.isFinite(n)) return "—";
  return `¥${n.toFixed(2)}`;
}

function formatMoneySigned(n) {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}`;
}

function formatNumber(n, digits = 4) {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

function formatPctSigned(n) {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function SettingsTinyIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.5-2-3.5-2.3.5a8.02 8.02 0 0 0-1.7-1l-.4-2.3h-4l-.4 2.3a8.02 8.02 0 0 0-1.7 1l-2.3-.5-2 3.5 2 1.5a7.97 7.97 0 0 0 .1 2l-2 1.5 2 3.5 2.3-.5a8.02 8.02 0 0 0 1.7 1l.4 2.3h4l.4-2.3a8.02 8.02 0 0 0 1.7-1l2.3.5 2-3.5-2-1.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FundCard({
  fund: f,
  holding,
  idx,
  viewMode,
  currentTab,
  favorites,
  isTradingDay,
  todayStr,
  getHoldingProfit,
  toggleFavorite,
  removeFundFromCurrentGroup,
  openFundDetail,
  onAction,
}) {
  const profit = getHoldingProfit(f, holding);

  // Data mapping for card view
  const navUnit = Number(f.dwjz);
  const estUnit = f.estPricedCoverage > 0.05 ? f.estGsz : Number(f.gsz);
  const estChangePct =
    f.estPricedCoverage > 0.05 ? f.estGszzl : Number(f.gszzl);
  const estTime = f.gztime;
  const navDate = f.jzrq;

  // List view change value logic (kept for list view consistency)
  const now = new Date();
  const isAfter9 = now.getHours() >= 9;
  const hasNavDate = typeof navDate === "string" && navDate.length >= 10;
  const hasTodayData = hasNavDate && navDate === todayStr;
  const useValuationByDate = hasNavDate && isYmdAfter(todayStr, navDate);
  const useValuationChange =
    useValuationByDate ||
    (!hasNavDate && isTradingDay && isAfter9 && !hasTodayData);
  const changeValue = useValuationChange
    ? f.estPricedCoverage > 0.05
      ? f.estGszzl
      : typeof f.gszzl === "number"
        ? f.gszzl
        : Number(f.gszzl)
    : f.zzl !== undefined
      ? Number(f.zzl)
      : typeof f.gszzl === "number"
        ? f.gszzl
        : Number(f.gszzl);
  const changeText = Number.isFinite(changeValue)
    ? `${changeValue > 0 ? "+" : ""}${changeValue.toFixed(2)}%`
    : "—";

  return (
    <motion.div
      layout="position"
      className={viewMode === "card" ? "col-6" : "table-row-wrapper"}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={viewMode === "card" ? "glass card" : "table-row"}
        data-fund-row="true"
        data-fund-code={f.code}
        role="link"
        tabIndex={0}
        onClick={(e) => openFundDetail(e, f.code)}
        onKeyDown={(e) => {
          if (e.key === "Enter") openFundDetail(e, f.code);
        }}
        style={{ cursor: "pointer" }}
      >
        {viewMode === "list" ? (
          <>
            {/* List View Implementation */}
            <div className="table-cell text-center index-cell">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                {idx + 1}
              </span>
            </div>
            <div className="table-cell name-cell">
              {currentTab !== "all" && currentTab !== "fav" ? (
                <button
                  className="icon-button fav-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFundFromCurrentGroup(f.code);
                  }}
                  title="从当前分组移除"
                >
                  <ExitIcon
                    width="18"
                    height="18"
                    style={{ transform: "rotate(180deg)" }}
                  />
                </button>
              ) : (
                <button
                  className={`icon-button fav-button ${favorites.has(f.code) ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(f.code);
                  }}
                  title={favorites.has(f.code) ? "取消自选" : "添加自选"}
                >
                  <StarIcon
                    width="18"
                    height="18"
                    filled={favorites.has(f.code)}
                  />
                </button>
              )}
              <div className="title-text">
                <span className="name-text">
                  <span
                    className="mobile-index"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--muted)",
                      marginRight: 6,
                    }}
                  >
                    {idx + 1}.
                  </span>
                  {f.name}
                </span>
                <span className="muted code-text">#{f.code}</span>
              </div>
            </div>

            <div className="table-cell text-center total-cell">
              {profit ? (
                <span
                  data-metric="positionAmount"
                  data-testid="fund-position-amount"
                  data-value={profit.amount}
                  style={{
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ¥{profit.amount.toFixed(2)}
                </span>
              ) : (
                <span className="muted">未设置</span>
              )}
            </div>

            <div className="table-cell text-center change-cell">
              <span
                className={
                  changeValue > 0 ? "up" : changeValue < 0 ? "down" : ""
                }
                data-metric="changePct"
                data-testid="fund-change-pct"
                data-value={Number.isFinite(changeValue) ? changeValue : ""}
                style={{
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {changeText}
              </span>
            </div>

            <div className="table-cell text-center today-profit-cell">
              {profit ? (
                <span
                  className={
                    profit.profitToday > 0
                      ? "up"
                      : profit.profitToday < 0
                        ? "down"
                        : ""
                  }
                  data-metric="profitToday"
                  data-testid="fund-profit-today"
                  data-value={profit.profitToday}
                  style={{
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {profit.profitToday > 0
                    ? "+"
                    : profit.profitToday < 0
                      ? "-"
                      : ""}
                  ¥{Math.abs(profit.profitToday).toFixed(2)}
                </span>
              ) : (
                <span className="muted">—</span>
              )}
            </div>

            <div className="table-cell text-center yesterday-profit-cell">
              {profit && typeof profit.profitYesterday === "number" ? (
                <span
                  className={
                    profit.profitYesterday > 0
                      ? "up"
                      : profit.profitYesterday < 0
                        ? "down"
                        : ""
                  }
                  data-metric="profitYesterday"
                  data-testid="fund-profit-yesterday"
                  data-value={profit.profitYesterday}
                  style={{
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {profit.profitYesterday > 0
                    ? "+"
                    : profit.profitYesterday < 0
                      ? "-"
                      : ""}
                  ¥{Math.abs(profit.profitYesterday).toFixed(2)}
                </span>
              ) : (
                <span className="muted">—</span>
              )}
            </div>

            <div className="table-cell text-center holding-profit-cell">
              {profit && typeof profit.profitTotal === "number" ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    lineHeight: 1.15,
                  }}
                >
                  <span
                    className={
                      profit.profitTotal > 0
                        ? "up"
                        : profit.profitTotal < 0
                          ? "down"
                          : ""
                    }
                    data-metric="profitTotal"
                    data-testid="fund-profit-total"
                    data-value={profit.profitTotal}
                    style={{
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {profit.profitTotal > 0
                      ? "+"
                      : profit.profitTotal < 0
                        ? "-"
                        : ""}
                    ¥{Math.abs(profit.profitTotal).toFixed(2)}
                  </span>
                  {typeof profit.profitRate === "number" ? (
                    <span
                      className={
                        profit.profitRate > 0
                          ? "up muted"
                          : profit.profitRate < 0
                            ? "down muted"
                            : "muted"
                      }
                      data-metric="profitRate"
                      data-testid="fund-profit-rate"
                      data-value={profit.profitRate}
                      style={{ fontSize: 11 }}
                    >
                      (
                      {profit.profitRate > 0
                        ? "+"
                        : profit.profitRate < 0
                          ? "-"
                          : ""}
                      {Math.abs(profit.profitRate).toFixed(2)}%)
                    </span>
                  ) : (
                    <span className="muted" style={{ fontSize: 11 }}>
                      (—)
                    </span>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    lineHeight: 1.15,
                  }}
                >
                  <span className="muted">—</span>
                  <span className="muted" style={{ fontSize: 11 }}>
                    (—)
                  </span>
                </div>
              )}
            </div>

            <div
              className="table-cell text-center action-cell"
              style={{ gap: 4 }}
            >
              <button
                className="icon-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("edit", f);
                }}
                title="设置持仓"
                style={{ width: "28px", height: "28px" }}
              >
                <SettingsIcon width="14" height="14" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Card View - Detailed Layout */}
            <div className="row" style={{ marginBottom: 20 }}>
              <div className="title">
                {currentTab !== "all" && currentTab !== "fav" ? (
                  <button
                    className="icon-button fav-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFundFromCurrentGroup(f.code);
                    }}
                    title="从当前分组移除"
                  >
                    <ExitIcon
                      width="18"
                      height="18"
                      style={{ transform: "rotate(180deg)" }}
                    />
                  </button>
                ) : (
                  <button
                    className={`icon-button fav-button ${favorites.has(f.code) ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(f.code);
                    }}
                    title={favorites.has(f.code) ? "取消自选" : "添加自选"}
                  >
                    <StarIcon
                      width="18"
                      height="18"
                      filled={favorites.has(f.code)}
                    />
                  </button>
                )}
                <div className="title-text">
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {f.name}
                  </span>
                  <span className="muted">#{f.code}</span>
                </div>
              </div>

              <div className="actions">
                <div className="badge-v">
                  <span>估值时间</span>
                  <strong>{estTime || navDate || "—"}</strong>
                </div>
                {/* 
                  Only show delete if not in special tabs? 
                  Original card didn't show delete button in card view unless via menu?
                  The requested design has a delete button. 
                  But 'removeFundFromCurrentGroup' is what we have passed. 
                  If it's 'all' or 'fav', we might want to toggle favorite or do nothing?
                  In detail view, delete means 'remove from local list entirely'.
                  Here, let's use removeFundFromCurrentGroup if in group, or maybe just omit it if inconsistent?
                  The user asked to move the content. The content has a delete button.
                  Let's implement it. If in 'all', it might mean remove from list (hide).
                */}
                {currentTab !== "all" && currentTab !== "fav" && (
                  <div className="row" style={{ gap: 4 }}>
                    <button
                      className="icon-button danger"
                      title="从分组移除"
                      style={{ width: 28, height: 28 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFundFromCurrentGroup(f.code);
                      }}
                    >
                      <TrashIcon width="14" height="14" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div
                className="row"
                style={{ marginBottom: 14, alignItems: "stretch" }}
              >
                <div
                  className="stat"
                  style={{
                    cursor: "pointer",
                    flexDirection: "column",
                    gap: 4,
                    flex: "1 1 0%",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Open action menu
                    onAction("menu", f);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onAction("menu", f);
                    }
                  }}
                >
                  <span
                    className="label"
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    持仓金额{" "}
                    <SettingsTinyIcon
                      width="12"
                      height="12"
                      style={{ opacity: 0.7 }}
                    />
                  </span>
                  <span
                    className="value"
                    style={{
                      fontSize: 24,
                      lineHeight: 1.1,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatMoneyAbs(profit?.amount)}
                  </span>
                </div>
                <div
                  className="stat"
                  style={{
                    flexDirection: "column",
                    gap: 4,
                    flex: "1 1 0%",
                    alignItems: "flex-end",
                    textAlign: "right",
                  }}
                >
                  <span className="label">当日盈亏</span>
                  <span
                    className={`value ${pickUpDownClass(profit?.profitToday)}`}
                    style={{
                      fontSize: 22,
                      lineHeight: 1.1,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {formatMoneySigned(profit?.profitToday)}
                  </span>
                </div>
              </div>

              <div className="row" style={{ marginBottom: 14 }}>
                <div
                  className="stat"
                  style={{ flexDirection: "column", gap: 4 }}
                >
                  <span className="label">昨日收益</span>
                  <span
                    className={`value ${pickUpDownClass(profit?.profitYesterday)}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatMoneySigned(profit?.profitYesterday)}
                  </span>
                </div>
                <div
                  className="stat"
                  style={{ flexDirection: "column", gap: 4 }}
                >
                  <span className="label">持有收益</span>
                  <span
                    className={`value ${pickUpDownClass(profit?.profitTotal)}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatMoneySigned(profit?.profitTotal)}
                  </span>
                </div>
                <div
                  className="stat"
                  style={{ flexDirection: "column", gap: 4 }}
                >
                  <span className="label">持有收益率</span>
                  <span
                    className={`value ${pickUpDownClass(profit?.profitRate)}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatPctSigned(profit?.profitRate)}
                  </span>
                </div>
              </div>

              <div className="row" style={{ marginBottom: 14 }}>
                <div
                  className="stat"
                  style={{ flexDirection: "column", gap: 4 }}
                >
                  <span className="label">持有份额</span>
                  <span
                    className="value"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatNumber(profit?.share, 2)}
                  </span>
                </div>
                <div
                  className="stat"
                  style={{ flexDirection: "column", gap: 4 }}
                >
                  <span className="label">持仓成本价</span>
                  <span
                    className="value"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {formatMoneyAbs(profit?.costAmount)}
                  </span>
                </div>
                <div
                  className="stat"
                  style={{ flexDirection: "column", gap: 4 }}
                >
                  <span className="label">持仓成本单价</span>
                  <span
                    className="value"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {Number.isFinite(profit?.costUnit)
                      ? `¥${formatNumber(profit?.costUnit, 4)}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="row" style={{ marginBottom: 14 }}>
              <div
                className="stat"
                style={{ flexDirection: "column", gap: 4, minWidth: 0 }}
              >
                <span
                  className="label"
                  style={{
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  单位净值
                </span>
                <span
                  className="value"
                  style={{
                    fontSize: 15,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatNumber(navUnit, 4)}
                </span>
              </div>
              <div
                className="stat"
                style={{ flexDirection: "column", gap: 4, minWidth: 0 }}
              >
                <span
                  className="label"
                  style={{
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  估值净值
                </span>
                <span
                  className="value"
                  style={{
                    fontSize: 15,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatNumber(estUnit, 4)}
                </span>
              </div>
              <div
                className="stat"
                style={{ flexDirection: "column", gap: 4, minWidth: 0 }}
              >
                <span
                  className="label"
                  style={{
                    fontSize: 11,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  估值涨跌幅
                </span>
                <span
                  className={`value ${pickUpDownClass(estChangePct)}`}
                  style={{
                    fontSize: 15,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {formatPctSigned(estChangePct)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
