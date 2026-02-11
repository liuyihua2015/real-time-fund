import { useState, useEffect, useCallback } from "react";

export function useSettings() {
  const [refreshMs, setRefreshMs] = useState(30000);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSeconds, setTempSeconds] = useState(30);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMs = parseInt(localStorage.getItem("refreshMs") || "30000", 10);
      if (Number.isFinite(savedMs) && savedMs >= 5000) {
        setRefreshMs(savedMs);
        setTempSeconds(Math.round(savedMs / 1000));
      }
    }
  }, []);

  const saveSettings = useCallback(() => {
    const ms = tempSeconds * 1000;
    if (ms < 5000) {
      alert("刷新间隔最少 5 秒");
      return;
    }
    setRefreshMs(ms);
    localStorage.setItem("refreshMs", String(ms));
    setSettingsOpen(false);
  }, [tempSeconds]);

  return {
    refreshMs,
    setRefreshMs,
    settingsOpen,
    setSettingsOpen,
    tempSeconds,
    setTempSeconds,
    saveSettings
  };
}
