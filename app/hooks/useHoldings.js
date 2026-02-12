import { useState, useEffect, useRef, useCallback } from "react";
import { loadHoldings, saveHoldings, normalizeHolding } from "../lib/holdingsStorage";
import { formatYmd } from "../lib/dateUtils";
import { calcHoldingProfit } from "../lib/holdingProfit";

export function useHoldings(isTradingDay) {
  const [holdings, setHoldings] = useState({});
  const [historyCache, setHistoryCache] = useState({});
  const fetchingHistory = useRef(new Set());
  
  const today = new Date();
  const todayStr = formatYmd(today);

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

  const importHoldings = useCallback((rawHoldings) => {
    const isPlainObject = (v) =>
      !!v && typeof v === "object" && !Array.isArray(v);

    const next = {};
    if (isPlainObject(rawHoldings)) {
      for (const [code, holding] of Object.entries(rawHoldings)) {
        if (!code) continue;
        const normalized = normalizeHolding(holding);
        if (normalized) next[code] = normalized;
      }
    }

    setHoldings(next);
    setHistoryCache({});
    saveHoldings(next);
  }, []);

  const getHoldingProfit = useCallback((fund, holding) => {
    const history = historyCache?.[fund?.code];
    return calcHoldingProfit({
      fund,
      holding,
      history,
      isTradingDay,
      todayStr,
    });
  }, [historyCache, isTradingDay, todayStr]);

  return {
    holdings,
    updateHolding,
    importHoldings,
    getHoldingProfit,
  };
}
