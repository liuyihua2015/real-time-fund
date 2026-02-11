import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SortArrowsIcon } from "../Icons";
import FundCard from "./FundCard";

export default function FundList({
  funds, // listDisplayFunds
  viewMode,
  listSort,
  toggleListSort,
  // Props for FundCard
  holdings,
  currentTab,
  favorites,
  isTradingDay,
  todayStr,
  getHoldingProfit,
  collapsedCodes,
  toggleCollapse,
  toggleFavorite,
  removeFundFromCurrentGroup,
  openFundDetail,
  onAction,
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={viewMode === "card" ? "grid" : "table-container glass"}
      >
        <div
          className={viewMode === "card" ? "grid col-12" : ""}
          style={viewMode === "card" ? { gridColumn: "span 12", gap: 16 } : {}}
        >
          <AnimatePresence mode="popLayout">
            {viewMode === "list" && (
              <div className="table-header-row">
                <div className="table-cell table-header-cell text-center index-cell">
                  序号
                </div>
                <div
                  className="table-cell table-header-cell"
                  style={{
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <span>基金</span>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      className="table-sort"
                      onClick={() => toggleListSort("name")}
                    >
                      名称{" "}
                      <SortArrowsIcon
                        width="14"
                        height="14"
                        active={listSort.key === "name"}
                        dir={listSort.dir}
                      />
                    </button>
                    <button
                      type="button"
                      className="table-sort"
                      onClick={() => toggleListSort("code")}
                    >
                      代码{" "}
                      <SortArrowsIcon
                        width="14"
                        height="14"
                        active={listSort.key === "code"}
                        dir={listSort.dir}
                      />
                    </button>
                  </div>
                </div>
                <div className="table-cell table-header-cell text-center">
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleListSort("total")}
                  >
                    持仓总额{" "}
                    <SortArrowsIcon
                      width="14"
                      height="14"
                      active={listSort.key === "total"}
                      dir={listSort.dir}
                    />
                  </button>
                </div>
                <div className="table-cell table-header-cell text-center">
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleListSort("change")}
                  >
                    当前涨幅{" "}
                    <SortArrowsIcon
                      width="14"
                      height="14"
                      active={listSort.key === "change"}
                      dir={listSort.dir}
                    />
                  </button>
                </div>
                <div className="table-cell table-header-cell text-center">
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleListSort("todayProfit")}
                  >
                    当前收益{" "}
                    <SortArrowsIcon
                      width="14"
                      height="14"
                      active={listSort.key === "todayProfit"}
                      dir={listSort.dir}
                    />
                  </button>
                </div>
                <div className="table-cell table-header-cell text-center">
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleListSort("yesterdayProfit")}
                  >
                    昨日收益{" "}
                    <SortArrowsIcon
                      width="14"
                      height="14"
                      active={listSort.key === "yesterdayProfit"}
                      dir={listSort.dir}
                    />
                  </button>
                </div>
                <div className="table-cell table-header-cell text-center">
                  <button
                    type="button"
                    className="table-sort"
                    onClick={() => toggleListSort("holdingProfit")}
                  >
                    持有收益{" "}
                    <SortArrowsIcon
                      width="14"
                      height="14"
                      active={listSort.key === "holdingProfit"}
                      dir={listSort.dir}
                    />
                  </button>
                </div>
                <div className="table-cell table-header-cell text-center">
                  设置
                </div>
              </div>
            )}
            {funds.map((f, idx) => (
              <FundCard
                key={f.code}
                fund={f}
                idx={idx}
                holding={holdings[f.code]}
                viewMode={viewMode}
                currentTab={currentTab}
                favorites={favorites}
                isTradingDay={isTradingDay}
                todayStr={todayStr}
                getHoldingProfit={getHoldingProfit}
                collapsedCodes={collapsedCodes}
                toggleCollapse={toggleCollapse}
                toggleFavorite={toggleFavorite}
                removeFundFromCurrentGroup={removeFundFromCurrentGroup}
                openFundDetail={openFundDetail}
                onAction={onAction}
              />
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
