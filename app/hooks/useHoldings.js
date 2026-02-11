import { useState, useEffect, useRef, useCallback } from "react";
import { loadHoldings, saveHoldings } from "../lib/holdingsStorage";

export function useHoldings(isTradingDay) {
  const [holdings, setHoldings] = useState({});
  const [historyCache, setHistoryCache] = useState({});
  const fetchingHistory = useRef(new Set());
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Load holdings on mount
  useEffect(() => {
    const loaded = loadHoldings();
    setHoldings(loaded || {});
  }, []);

  // Fetch history for funds with startDate
  useEffect(() => {
    const codesWithDate = Object.keys(holdings).filter(
      (c) => holdings[c]?.startDate
    );
    const missing = codesWithDate.filter(
      (c) => !historyCache[c] && !fetchingHistory.current.has(c)
    );

    if (missing.length > 0) {
      missing.forEach((c) => {
        fetchingHistory.current.add(c);
        fetch(`/api/fund/${c}`)
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data?.history)) {
              setHistoryCache((prev) => ({ ...prev, [c]: data.history }));
            }
          })
          .catch(() => {})
          .finally(() => {
            fetchingHistory.current.delete(c);
          });
      });
    }
  }, [holdings, historyCache]);

  const updateHolding = useCallback((code, data) => {
    setHoldings((prev) => {
      const next = { ...prev };
      const shouldDelete = data && Object.values(data).every((v) => v === null);
      if (shouldDelete) {
        delete next[code];
      } else {
        next[code] = data;
      }
      saveHoldings(next);
      return next;
    });
  }, []);

  const getHoldingProfit = useCallback((fund, holding) => {
    if (!holding || typeof holding.share !== "number") return null;

    const now = new Date();
    const isAfter9 = now.getHours() >= 9;
    const hasTodayData = fund.jzrq === todayStr;

    // 如果是交易日且9点以后，且今日净值未出，则强制使用估值（隐藏涨跌幅列模式）
    const useValuation = isTradingDay && isAfter9 && !hasTodayData;

    let currentNav;
    let profitToday;

    const share = holding.share;
    const costAmount =
      typeof holding.costAmount === "number"
        ? holding.costAmount
        : typeof holding.cost === "number"
          ? holding.cost * share
          : null;
    const costUnit =
      typeof holding.costAmount === "number"
        ? share > 0
          ? holding.costAmount / share
          : 0
        : typeof holding.cost === "number"
          ? holding.cost
          : null;

    if (!useValuation) {
      // 使用确权净值 (dwjz)
      currentNav = Number(fund.dwjz);
      if (!currentNav) return null;

      const amount = share * currentNav;
      // 优先用 zzl (真实涨跌幅), 降级用 gszzl
      const rate =
        fund.zzl !== undefined ? Number(fund.zzl) : Number(fund.gszzl) || 0;
      const denom = 1 + rate / 100;
      profitToday = denom ? amount - amount / denom : 0;
    } else {
      // 否则使用估值
      currentNav =
        fund.estPricedCoverage > 0.05
          ? fund.estGsz
          : typeof fund.gsz === "number"
            ? fund.gsz
            : Number(fund.dwjz);

      if (!currentNav) return null;

      const amount = share * currentNav;
      // 估值涨跌幅
      const gzChange =
        fund.estPricedCoverage > 0.05 ? fund.estGszzl : Number(fund.gszzl) || 0;
      const denom = 1 + gzChange / 100;
      profitToday = denom ? amount - amount / denom : 0;
    }

    // 持仓金额
    const amount = share * currentNav;

    let profitTotal = null;
    const history = historyCache[fund.code];

    // 优先使用历史数据计算（如果设置了开始日期）
    if (holding.startDate && history && Array.isArray(history)) {
      // 查找开始日期对应的净值（或者前一天的净值作为基准）
      const startIndex = history.findIndex((h) => h.date >= holding.startDate);
      let baseNav = null;
      if (startIndex > 0) {
        baseNav = history[startIndex - 1].nav;
      }

      if (
        baseNav !== null &&
        typeof share === "number" &&
        Number.isFinite(currentNav)
      ) {
        const floatingProfit = share * (currentNav - baseNav);
        const realizedProfit =
          typeof holding.profitTotal === "number" ? holding.profitTotal : 0;
        profitTotal = floatingProfit + realizedProfit;
      }
    }

    // 降级到使用成本价计算
    if (profitTotal === null) {
      if (typeof costUnit === "number") {
        const floatingProfit = (currentNav - costUnit) * share;
        const realizedProfit =
          typeof holding.profitTotal === "number" ? holding.profitTotal : 0;
        profitTotal = floatingProfit + realizedProfit;
      } else if (typeof holding.profitTotal === "number") {
        profitTotal = holding.profitTotal;
      }
    }

    const profitRate =
      costAmount && profitTotal !== null
        ? (profitTotal / costAmount) * 100
        : null;

    let profitYesterday = null;
    const confirmedNav = Number(fund.dwjz);
    const formatYmd = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayIsWeekend =
      yesterday.getDay() === 0 || yesterday.getDay() === 6;
    const yesterdayStr = formatYmd(yesterday);
    if (yesterdayIsWeekend) {
      profitYesterday = 0;
    } else if (confirmedNav && fund.jzrq === yesterdayStr) {
      const rateConfirmed =
        fund.zzl !== undefined ? Number(fund.zzl) : Number(fund.gszzl) || 0;
      const confirmedAmount = share * confirmedNav;
      const denom = 1 + rateConfirmed / 100;
      profitYesterday = denom ? confirmedAmount - confirmedAmount / denom : 0;
    }

    return {
      share,
      costAmount,
      costUnit,
      amount,
      profitToday,
      profitTotal,
      profitRate,
      profitYesterday,
    };
  }, [historyCache, isTradingDay, todayStr]);

  return {
    holdings,
    updateHolding,
    getHoldingProfit,
  };
}
