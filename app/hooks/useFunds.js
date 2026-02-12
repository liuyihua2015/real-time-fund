import { useState, useEffect, useRef, useCallback } from "react";

export function useFunds() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const [isTradingDay, setIsTradingDay] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // 检查交易日状态
  const checkTradingDay = useCallback(() => {
    // Simple check: default to true for weekdays (Mon-Fri)
    const now = new Date();
    const day = now.getDay();
    const isWeekday = day !== 0 && day !== 6;
    setIsTradingDay(isWeekday);
  }, []);

  useEffect(() => {
    checkTradingDay();
    // 每分钟检查一次
    const timer = setInterval(checkTradingDay, 60000);
    return () => clearInterval(timer);
  }, [checkTradingDay]);

  // 按 code 去重
  const dedupeByCode = (list) => {
    const seen = new Set();
    return list.filter((f) => {
      const c = f?.code;
      if (!c || seen.has(c)) return false;
      seen.add(c);
      return true;
    });
  };

  const fetchFundData = async (c) => {
    return new Promise(async (resolve, reject) => {
      // 腾讯接口识别逻辑优化
      const getTencentPrefix = (code) => {
        if (code.startsWith("6") || code.startsWith("9")) return "sh";
        if (code.startsWith("0") || code.startsWith("3")) return "sz";
        if (code.startsWith("4") || code.startsWith("8")) return "bj";
        return "sz";
      };

      const gzUrl = `https://fundgz.1234567.com.cn/js/${c}.js?rt=${Date.now()}`;

      // 使用更安全的方式处理全局回调，避免并发覆盖
      // const currentCallback = `jsonpgz_${c}_${Math.random().toString(36).slice(2, 7)}`;

      // 动态拦截并处理 jsonpgz 回调
      const scriptGz = document.createElement("script");
      // 东方财富接口固定调用 jsonpgz，我们通过修改全局变量临时捕获它
      scriptGz.src = gzUrl;

      const originalJsonpgz = window.jsonpgz;
      window.jsonpgz = (json) => {
        window.jsonpgz = originalJsonpgz; // 立即恢复
        if (!json || typeof json !== "object") {
          reject(new Error("未获取到基金估值数据"));
          return;
        }
        const gszzlNum = Number(json.gszzl);
        const gzData = {
          code: json.fundcode,
          name: json.name,
          dwjz: json.dwjz,
          gsz: json.gsz,
          gztime: json.gztime,
          jzrq: json.jzrq,
          gszzl: Number.isFinite(gszzlNum) ? gszzlNum : json.gszzl,
        };
        resolve(gzData);
        scriptGz.remove();
      };

      scriptGz.onerror = () => {
        window.jsonpgz = originalJsonpgz;
        scriptGz.remove();
        // 估值接口失败，尝试请求基础信息接口
        fetch(`/api/fund/${c}`)
          .then((r) => r.json())
          .then((data) => {
            const nav = data.nav || {};
            resolve({
              code: c,
              name: data.name || c,
              dwjz: nav.navUnit,
              gsz: nav.estimateUnit,
              gztime: nav.estimateTime,
              jzrq: nav.navDate,
              gszzl: nav.estimateChangePct || 0,
            });
          })
          .catch((err) => reject(err));
      };

      document.body.appendChild(scriptGz);
    });
  };

  const refreshAll = useCallback(async (codes) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    const uniqueCodes = Array.from(new Set(codes));
    try {
      const updated = [];
      for (const c of uniqueCodes) {
        try {
          const data = await fetchFundData(c);
          updated.push(data);
        } catch (e) {
          console.error(`刷新基金 ${c} 失败`, e);
          // 失败时从当前 state 中寻找旧数据
          setFunds((prev) => {
            const old = prev.find((f) => f.code === c);
            if (old) updated.push(old);
            return prev;
          });
        }
      }

      if (updated.length > 0) {
        setFunds((prev) => {
          // 将更新后的数据合并回当前最新的 state 中，防止覆盖掉刚刚导入的数据
          const merged = [...prev];
          updated.forEach((u) => {
            const idx = merged.findIndex((f) => f.code === u.code);
            if (idx > -1) {
              merged[idx] = u;
            } else {
              merged.push(u);
            }
          });
          const deduped = dedupeByCode(merged);
          localStorage.setItem("funds", JSON.stringify(deduped));
          return deduped;
        });
      }
      setLastRefreshTime(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, []);

  const addFund = useCallback(async (selectedCodes, funds, nameMap = {}) => {
    const newFunds = [];
    const failures = [];
    for (const c of selectedCodes) {
      if (funds.some((f) => f.code === c)) continue;
      try {
        const data = await fetchFundData(c);
        newFunds.push(data);
      } catch (err) {
        failures.push({ code: c, name: nameMap[c] });
      }
    }
    return { newFunds, failures };
  }, []);

  const removeFund = useCallback(
    (removeCode, groups, setGroups, setCollapsedCodes) => {
      setFunds((prev) => {
        const next = prev.filter((f) => f.code !== removeCode);
        localStorage.setItem("funds", JSON.stringify(next));
        return next;
      });

      // 同步删除分组中的失效代码
      if (groups && setGroups) {
        const nextGroups = groups.map((g) => ({
          ...g,
          codes: g.codes.filter((c) => c !== removeCode),
        }));
        setGroups(nextGroups);
        localStorage.setItem("groups", JSON.stringify(nextGroups));
      }

      // 同步删除展开收起状态
      if (setCollapsedCodes) {
        setCollapsedCodes((prev) => {
          if (!prev.has(removeCode)) return prev;
          const nextSet = new Set(prev);
          nextSet.delete(removeCode);
          return nextSet;
        });
      }
    },
    [],
  );

  // Load initial funds
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("funds") || "[]");
      if (Array.isArray(saved) && saved.length) {
        // Sanitize data: flatten nested objects if present
        const sanitized = saved.map((f) => {
          if (!f) return f;
          const nav = f.nav || {}; // If nav exists (from bad data), use it
          // Check if dwjz is an object (bad data indicator)
          if (typeof f.dwjz === "object" && f.dwjz !== null) {
            // It's likely the old bad structure or f.dwjz is actually the nav object
            // But based on previous analysis, we likely had:
            // dwjz: data.nav (which is { navUnit, ... })
            // So f.dwjz.navUnit would be the value.
            // Let's be safe and look for nested properties if they exist
            return {
              ...f,
              dwjz: f.dwjz.navUnit ?? f.dwjz, // Try to extract if object, else keep
              gsz: f.gsz?.estimateUnit ?? f.gsz,
              gztime: f.gztime?.estimateTime ?? f.gztime,
              jzrq: f.jzrq?.navDate ?? f.jzrq,
              gszzl: f.gszzl?.estimateChangePct ?? f.gszzl,
            };
          }
          // Also check if 'nav' property exists and we want to flatten it?
          // The previous bad code did: dwjz: data.nav.
          // So f.dwjz IS the nav object.
          // Let's strictly check for the specific bad pattern: dwjz having navUnit
          let newF = { ...f };
          if (newF.dwjz && typeof newF.dwjz === "object")
            newF.dwjz = newF.dwjz.navUnit;
          if (newF.gsz && typeof newF.gsz === "object")
            newF.gsz = newF.gsz.estimateUnit;
          if (newF.gztime && typeof newF.gztime === "object")
            newF.gztime = newF.gztime.estimateTime;
          if (newF.jzrq && typeof newF.jzrq === "object")
            newF.jzrq = newF.jzrq.navDate;
          if (newF.gszzl && typeof newF.gszzl === "object")
            newF.gszzl = newF.gszzl.estimateChangePct;

          return newF;
        });

        const deduped = dedupeByCode(sanitized);
        setFunds(deduped);

        // Initial refresh logic moved to component to avoid double fetch if needed,
        // or keep it here if we want auto-refresh on mount.
        // For now, let's expose refreshAll and let component call it if needed.
        const codes = Array.from(new Set(deduped.map((f) => f.code)));
        const shouldSkip =
          sessionStorage.getItem("skip_refresh_on_mount") === "true";
        if (shouldSkip) {
          sessionStorage.removeItem("skip_refresh_on_mount");
        } else if (codes.length) {
          refreshAll(codes);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [refreshAll]);

  return {
    funds,
    setFunds,
    loading,
    setLoading,
    error,
    setError,
    refreshing,
    isTradingDay,
    lastRefreshTime,
    refreshAll,
    fetchFundData,
    addFund,
    removeFund,
  };
}
