import { useState, useEffect, useMemo, useCallback } from "react";

export function useFundListLogic(
  funds,
  holdings,
  currentTab,
  favorites,
  groups,
  isTradingDay,
  todayStr,
  getHoldingProfit
) {
  // 排序状态
  const [listSort, setListSort] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("fund_list_sort");
        return saved ? JSON.parse(saved) : { key: "index", dir: "asc" };
      } catch (e) {
        return { key: "index", dir: "asc" };
      }
    }
    return { key: "index", dir: "asc" };
  });

  // 保存排序状态
  useEffect(() => {
    sessionStorage.setItem("fund_list_sort", JSON.stringify(listSort));
  }, [listSort]);

  // 视图模式
  const [viewMode, setViewMode] = useState("card"); // card, list

  // 收起/展开状态
  const [collapsedCodes, setCollapsedCodes] = useState(new Set());
  
  // 本地搜索与添加基金 UI 状态
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
        const next = prev === "card" ? "list" : "card";
        localStorage.setItem("viewMode", next);
        return next;
    });
  }, []);
  
  useEffect(() => {
      const saved = localStorage.getItem("viewMode");
      if (saved) setViewMode(saved);
  }, []);

  const toggleCollapse = useCallback((code) => {
    setCollapsedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const toggleListSort = useCallback((key) => {
    setListSort((prev) => {
      if (key === "index") return prev;
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      const dir =
        key === "name" || key === "code" || key === "index" ? "asc" : "desc";
      return { key, dir };
    });
  }, []);

  const filteredFunds = useMemo(() => {
    let result = [];
    if (!funds.length) result = [];
    else if (currentTab === "all") result = funds;
    else if (currentTab === "fav")
      result = funds.filter((f) => favorites.has(f.code));
    else {
      const group = groups.find((g) => g.id === currentTab);
      if (!group) result = [];
      else {
        const codes = new Set(group.codes || []);
        result = funds.filter((f) => codes.has(f.code));
      }
    }

    if (localSearchTerm.trim()) {
      const term = localSearchTerm.trim().toLowerCase();
      result = result.filter(
        (f) =>
          (f.name && f.name.toLowerCase().includes(term)) ||
          (f.code && f.code.includes(term)),
      );
    }
    return result;
  }, [funds, currentTab, favorites, groups, localSearchTerm]);

  const listDisplayFunds = useMemo(() => {
    if (!filteredFunds.length) return [];
    const base = filteredFunds.slice();
    const { key, dir } = listSort;
    if (key === "index") return dir === "desc" ? base.reverse() : base;

    const now = new Date();
    const isAfter9 = now.getHours() >= 9;
    const metrics = new Map();
    for (const f of base) {
      const holding = holdings[f.code];
      const profit = getHoldingProfit(f, holding);
      const hasTodayData = f.jzrq === todayStr;
      const useValuationChange = isTradingDay && isAfter9 && !hasTodayData;
      let change = null;
      if (useValuationChange) {
        if (f.estPricedCoverage > 0.05) {
          const v = Number(f.estGszzl);
          change = Number.isFinite(v) ? v : null;
        } else {
          const v = typeof f.gszzl === "number" ? f.gszzl : Number(f.gszzl);
          change = Number.isFinite(v) ? v : null;
        }
      } else if (f.zzl !== undefined) {
        const v = Number(f.zzl);
        change = Number.isFinite(v) ? v : null;
      } else {
        const v = typeof f.gszzl === "number" ? f.gszzl : Number(f.gszzl);
        change = Number.isFinite(v) ? v : null;
      }
      metrics.set(f.code, { profit, change });
    }

    const compare = (a, b) => {
      if (key === "name") {
        const av = a?.name ?? "";
        const bv = b?.name ?? "";
        return dir === "asc"
          ? av.localeCompare(bv, "zh-CN")
          : bv.localeCompare(av, "zh-CN");
      }
      if (key === "code") {
        const av = a?.code ?? "";
        const bv = b?.code ?? "";
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }

      const profitA = metrics.get(a.code)?.profit ?? null;
      const profitB = metrics.get(b.code)?.profit ?? null;
      const missingA = !profitA;
      const missingB = !profitB;
      if (
        key === "total" ||
        key === "todayProfit" ||
        key === "yesterdayProfit" ||
        key === "holdingProfit"
      ) {
        if (missingA && missingB) return 0;
        if (missingA) return 1;
        if (missingB) return -1;
      }

      const av =
        key === "total"
          ? (profitA?.amount ?? null)
          : key === "todayProfit"
            ? (profitA?.profitToday ?? null)
            : key === "yesterdayProfit"
              ? (profitA?.profitYesterday ?? null)
              : key === "holdingProfit"
                ? (profitA?.profitTotal ?? null)
                : key === "change"
                  ? (metrics.get(a.code)?.change ?? null)
                  : null;

      const bv =
        key === "total"
          ? (profitB?.amount ?? null)
          : key === "todayProfit"
            ? (profitB?.profitToday ?? null)
            : key === "yesterdayProfit"
              ? (profitB?.profitYesterday ?? null)
              : key === "holdingProfit"
                ? (profitB?.profitTotal ?? null)
                : key === "change"
                  ? (metrics.get(b.code)?.change ?? null)
                  : null;

      const aMissing = !(typeof av === "number" && Number.isFinite(av));
      const bMissing = !(typeof bv === "number" && Number.isFinite(bv));
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      return dir === "asc" ? av - bv : bv - av;
    };

    return base.sort(compare);
  }, [filteredFunds, listSort, holdings, todayStr, isTradingDay, getHoldingProfit]);

  return {
      listSort,
      toggleListSort,
      viewMode,
      toggleViewMode,
      collapsedCodes,
      setCollapsedCodes, // Exposed for removeFund logic
      toggleCollapse,
      localSearchTerm,
      setLocalSearchTerm,
      filteredFunds,
      listDisplayFunds
  };
}
