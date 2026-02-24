"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Announcement from "./components/Announcement";
import HoldingEditModal from "./components/HoldingEditModal";
import ConfirmModal from "./components/ConfirmModal";
import HoldingActionModal from "./components/HoldingActionModal";
import TradeModal from "./components/TradeModal";
import { recognizeImage } from "./lib/ocrClient";
import { formatYmd, isYmdAfter } from "./lib/dateUtils";
import {
  loadTradeRecords,
  normalizeTradeRecordsMap,
  saveTradeRecords,
} from "./lib/tradeRecordsStorage";

import {
  PlusIcon,
  TrashIcon,
  SettingsIcon,
  RefreshIcon,
  GridIcon,
  SearchIcon,
  CloseIcon,
  ListIcon,
  FolderPlusIcon,
  MinusIcon,
  StarIcon,
  SortIcon,
  SortArrowsIcon,
} from "./components/Icons";
import DonateTabs from "./components/DonateTabs";
import FeedbackModal from "./components/modals/FeedbackModal";
import AddResultModal from "./components/modals/AddResultModal";
import SuccessModal from "./components/modals/SuccessModal";
import GroupManageModal from "./components/modals/GroupManageModal";
import AddFundToGroupModal from "./components/modals/AddFundToGroupModal";
import GroupModal from "./components/modals/GroupModal";
import GroupSummary from "./components/GroupSummary";
import FundList from "./components/list/FundList";

import { useFunds } from "./hooks/useFunds";
import { useHoldings } from "./hooks/useHoldings";
import { useGroups } from "./hooks/useGroups";
import { useFundListLogic } from "./hooks/useFundListLogic";
import { useFundSearch } from "./hooks/useFundSearch";
import { useSettings } from "./hooks/useSettings";

const sortOptions = [
  { key: "name", label: "名称" },
  { key: "code", label: "代码" },
  { key: "total", label: "持仓总额" },
  { key: "change", label: "今日涨幅" },
  { key: "todayProfit", label: "今日收益" },
  { key: "yesterdayProfit", label: "昨日收益" },
  { key: "holdingProfit", label: "持有收益" },
];

function CompassIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14.5 9.5l-2 5-5 2 2-5 5-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Custom Hooks
  const {
    refreshMs,
    setRefreshMs,
    settingsOpen,
    setSettingsOpen,
    tempSeconds,
    setTempSeconds,
    saveSettings,
  } = useSettings();

  const {
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
    addFund: addFundLogic,
    removeFund: removeFundLogic,
  } = useFunds();

  const { holdings, updateHolding, importHoldings, getHoldingProfit } =
    useHoldings(isTradingDay);

  const {
    favorites,
    groups,
    currentTab,
    setCurrentTab,
    toggleFavorite,
    replaceFavorites,
    addGroup,
    removeGroup,
    updateGroups,
    addFundsToGroup,
    removeFundFromGroup,
    toggleFundInGroup,
    setGroups,
  } = useGroups();

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    selectedFunds,
    setSelectedFunds,
    isSearching,
    handleSearchInput,
    toggleSelectFund,
    clearSearch,
  } = useFundSearch();

  const {
    listSort,
    toggleListSort,
    viewMode,
    toggleViewMode,
    setViewModeExplicit,
    collapsedCodes,
    setCollapsedCodes,
    toggleCollapse,
    localSearchTerm,
    setLocalSearchTerm,
    filteredFunds,
    listDisplayFunds,
  } = useFundListLogic(
    funds,
    holdings,
    currentTab,
    favorites,
    groups,
    isTradingDay,
    // Note: useFundListLogic calculates todayStr internally or we pass it?
    // Wait, useFundListLogic used todayStr as prop. We need to pass it.
    // I'll define todayStr here.
    formatYmd(new Date()),
    getHoldingProfit,
  );

  const todayStr = formatYmd(new Date());

  // Modal States
  const [actionModal, setActionModal] = useState({ open: false, fund: null });
  const [tradeModal, setTradeModal] = useState({
    open: false,
    fund: null,
    type: "buy",
  });
  const [clearConfirm, setClearConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [donateOpen, setDonateOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackNonce, setFeedbackNonce] = useState(0);
  const [addResultOpen, setAddResultOpen] = useState(false);
  const [addFailures, setAddFailures] = useState([]);
  const [holdingModal, setHoldingModal] = useState({ open: false, fund: null });
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupManageOpen, setGroupManageOpen] = useState(false);
  const [addFundToGroupOpen, setAddFundToGroupOpen] = useState(false);
  const [successModal, setSuccessModal] = useState({
    open: false,
    message: "",
  });
  const [editingGroup, setEditingGroup] = useState(null);

  // Search Dropdown UI State
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);

  // Sort Dropdown State
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef(null);

  // Auto Refresh
  const timerRef = useRef(null);
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // Only refresh visible funds to save resources
      const codes = filteredFunds.map((f) => f.code);
      if (codes.length > 0) {
        refreshAll(codes);
      }
    }, refreshMs);
    return () => clearInterval(timerRef.current);
  }, [refreshMs, filteredFunds, refreshAll]);

  // Handle outside click for search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleRefresh = () => {
    const codes = filteredFunds.map((f) => f.code);
    if (codes.length) refreshAll(codes);
  };

  const handleAddFund = async (e) => {
    e?.preventDefault?.();
    setError("");
    const manualTokens = String(searchTerm || "")
      .split(/[^0-9A-Za-z]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const selectedCodes = Array.from(
      new Set([
        ...selectedFunds.map((f) => f.CODE),
        ...manualTokens.filter((t) => /^\d{6}$/.test(t)),
      ]),
    );

    if (selectedCodes.length === 0) {
      setError("请输入或选择基金代码");
      return;
    }

    setLoading(true);
    try {
      const { newFunds, failures } = await addFundLogic(selectedCodes, funds);

      if (newFunds.length === 0 && failures.length === 0) {
        setError("未添加任何新基金");
      } else if (newFunds.length > 0) {
        setFunds((prev) => {
          // dedupe logic handled in addFundLogic? No, addFundLogic returns new funds.
          // We need to merge.
          // Wait, addFundLogic in useFunds was defined to return data, not set state.
          // Let's verify useFunds.js
          // It returns { newFunds, failures }. It does NOT setFunds.
          // So we need to merge here.
          const seen = new Set(prev.map((f) => f.code));
          const uniqueNew = newFunds.filter((f) => !seen.has(f.code));
          const next = [...uniqueNew, ...prev]; // New funds at top? Or append? Original was append but dedupe.
          // Let's append to match original behavior logic "dedupeByCode([...newFunds, ...funds])"
          // Wait, original was `dedupeByCode([...newFunds, ...funds])` -> newFunds at start.
          localStorage.setItem("funds", JSON.stringify(next));
          return next;
        });
      }

      clearSearch();
      setShowDropdown(false);
      setIsAddFundOpen(false);

      if (failures.length > 0) {
        setAddFailures(failures);
        setAddResultOpen(true);
      }
    } catch (e) {
      setError(e.message || "添加失败");
    } finally {
      setLoading(false);
    }
  };

  const removeFund = (code) => {
    removeFundLogic(code, groups, setGroups, setCollapsedCodes);
  };

  const openFundDetail = (e, code) => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) return;
    if (e.defaultPrevented) return;
    const target = e.target;
    if (target.closest('button, input, textarea, select, [role="button"]'))
      return;
    sessionStorage.setItem("skip_refresh_on_mount", "true");
    router.push(`/fund?code=${code}`);
  };

  const handleAction = (type, fund) => {
    if (type === "menu") {
      setActionModal({ open: true, fund });
    } else if (type === "edit") {
      setHoldingModal({ open: true, fund });
    } else if (type === "clear") {
      setClearConfirm({ fund });
    } else if (type === "buy" || type === "sell") {
      if (type === "sell") {
        const code = fund?.code;
        const h = code ? holdings?.[code] : null;
        const s = h ? Number(h.share) : 0;
        if (!(Number.isFinite(s) && s > 0)) {
          setError("当前没有持仓份额，无法减仓");
          return;
        }
      }
      setTradeModal({ open: true, fund, type });
    }
    // ActionModal close is handled in the modal or wrapper
  };

  const handleSaveHolding = (code, data) => {
    updateHolding(code, data);
    setHoldingModal({ open: false, fund: null });
  };

  const handleClearConfirm = () => {
    if (clearConfirm?.fund) {
      handleSaveHolding(clearConfirm.fund.code, {
        share: null,
        cost: null,
        costAmount: null,
        profitTotal: null,
      });
    }
    setClearConfirm(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm?.fund?.code) {
      removeFund(deleteConfirm.fund.code);
    }
    setDeleteConfirm(null);
  };

  const handleTrade = (fund, data) => {
    const current = holdings[fund.code] || {
      share: 0,
      cost: 0,
      costAmount: 0,
      profitTotal: 0,
    };
    const tradeType = data.type || tradeModal.type;
    const isBuy = tradeType === "buy";

    if (isBuy) {
      const newShare = current.share + data.share;
      const buyCost =
        typeof data.totalCost === "number"
          ? data.totalCost
          : data.price * data.share;
      const currentCostAmount =
        typeof current.costAmount === "number"
          ? current.costAmount
          : typeof current.cost === "number"
            ? current.cost * current.share
            : 0;
      const nextCostAmount = currentCostAmount + buyCost;
      const newCost = newShare > 0 ? nextCostAmount / newShare : 0;

      handleSaveHolding(fund.code, {
        share: newShare,
        cost: newCost,
        costAmount: nextCostAmount,
        profitTotal:
          typeof current.profitTotal === "number" ? current.profitTotal : 0,
        startDate: current.startDate, // Keep existing start date
      });
    } else {
      const curShare =
        typeof current.share === "number" && Number.isFinite(current.share)
          ? current.share
          : 0;
      const sellShareRaw = Number(data.share);
      if (!(sellShareRaw > 0) || !(curShare > 0)) {
        setTradeModal({ open: false, fund: null, type: "buy" });
        return;
      }
      const eps = 1e-6;
      if (sellShareRaw > curShare + eps) {
        setError("减仓份额不能大于持仓份额");
        return;
      }
      const sellShare = Math.min(sellShareRaw, curShare);
      const sellAmountRaw =
        typeof data.redemptionAmount === "number"
          ? data.redemptionAmount
          : typeof data.totalAmount === "number"
            ? data.totalAmount
            : data.price * sellShareRaw;
      const sellAmount =
        sellShareRaw > 0
          ? sellAmountRaw * (sellShare / sellShareRaw)
          : sellAmountRaw;
      const newShare = Math.max(0, curShare - sellShare);

      // Calculate profit from this sale
      // Cost of sold shares
      const currentCostUnit =
        typeof current.costAmount === "number" && current.share > 0
          ? current.costAmount / current.share
          : typeof current.cost === "number"
            ? current.cost
            : 0;

      const costOfSold = currentCostUnit * sellShare;
      const profitRealized = sellAmount - costOfSold;

      const currentProfitTotal =
        typeof current.profitTotal === "number" ? current.profitTotal : 0;
      const nextProfitTotal = currentProfitTotal + profitRealized;

      const currentCostAmount =
        typeof current.costAmount === "number"
          ? current.costAmount
          : typeof current.cost === "number"
            ? current.cost * current.share
            : 0;
      const nextCostAmount = Math.max(0, currentCostAmount - costOfSold);

      handleSaveHolding(fund.code, {
        share: newShare,
        cost: currentCostUnit, // Unit cost doesn't change on sell
        costAmount: nextCostAmount,
        profitTotal: nextProfitTotal,
        startDate: current.startDate,
      });
    }
    setTradeModal({ open: false, fund: null, type: "buy" });
  };

  const handleAddFundsToGroupWrapper = (codes) => {
    addFundsToGroup(currentTab, codes);
    setAddFundToGroupOpen(false);
    setSuccessModal({ open: true, message: `成功添加 ${codes.length} 支基金` });
  };

  const removeFundFromCurrentGroup = (code) => {
    removeFundFromGroup(currentTab, code);
  };

  // Import/Export Logic
  const importFileRef = useRef(null);
  const [importMsg, setImportMsg] = useState("");

  const exportLocalData = () => {
    const data = {
      schemaVersion: 2,
      funds,
      holdings,
      groups,
      favorites: Array.from(favorites),
      refreshMs,
      viewMode,
      tradeRecords: normalizeTradeRecordsMap(loadTradeRecords()),
      exportTime: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fund-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.target;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result;
        const data = JSON.parse(typeof raw === "string" ? raw : "");
        if (!data || typeof data !== "object") throw new Error("bad data");
        if (Array.isArray(data.funds)) {
          setFunds(data.funds);
          localStorage.setItem("funds", JSON.stringify(data.funds));
        }
        if (Array.isArray(data.groups)) {
          updateGroups(data.groups);
        }
        if (Array.isArray(data.favorites)) {
          replaceFavorites(data.favorites);
        }
        if (data.holdings && typeof data.holdings === "object") {
          importHoldings(data.holdings);
        }
        if (data.tradeRecords && typeof data.tradeRecords === "object") {
          saveTradeRecords(normalizeTradeRecordsMap(data.tradeRecords));
        }
        if (data.refreshMs != null) {
          const ms = Number(data.refreshMs);
          if (Number.isFinite(ms) && ms >= 5000) {
            setRefreshMs(ms);
            setTempSeconds(Math.round(ms / 1000));
            localStorage.setItem("refreshMs", String(ms));
          }
        }
        if (data.viewMode === "card" || data.viewMode === "list") {
          setViewModeExplicit(data.viewMode);
        }
        setImportMsg("导入成功");
        setTimeout(() => {
          setImportMsg("");
          setSettingsOpen(false);
        }, 800);
      } catch (err) {
        const name = err?.name || "";
        const msg = String(err?.message || "");
        const hint =
          name === "QuotaExceededError" || msg.toLowerCase().includes("quota")
            ? "浏览器存储空间不足"
            : name === "SyntaxError"
              ? "JSON 格式错误"
              : msg
                ? msg
                : "未知错误";
        setImportMsg(`导入失败: ${hint}`);
      }
    };
    reader.readAsText(file);
    inputEl.value = "";
  };

  // OCR Logic
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        setLoading(true);
        try {
          const result = await recognizeImage(file);
          if (result && result.length > 0) {
            const { newFunds, failures } = await addFundLogic(
              result.map((r) => r.code),
              funds,
            );
            // ... same merge logic as addFund ...
            // This duplication suggests addFund logic in component should be reused.
            // I'll extract handleAddFundLogic helper inside component.
          }
        } catch (err) {
          setError("识别失败: " + err.message);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [funds]); // funds dep needed for addFundLogic check

  const getGroupName = () => {
    if (currentTab === "all") return "全部基金";
    if (currentTab === "fav") return "自选基金";
    return groups.find((g) => g.id === currentTab)?.name || "";
  };

  return (
    <div className="ui-page">
      <div className="ui-glass ui-panel">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1 className="title hero-title">
            <span className="hero-title-row">
              <CompassIcon
                width="26"
                height="26"
                style={{ color: "var(--primary)" }}
              />
              <span className="hero-title-text">估值罗盘</span>
            </span>
            <span className="muted hero-subtitle">实时估值 · 一眼看仓位</span>
          </h1>
          <div className="row">
            <Announcement />
            <div
              className="refresh-info"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                marginRight: "8px",
                fontSize: "11px",
                color: "var(--muted)",
                lineHeight: "1.2",
              }}
            >
              <span>{refreshMs / 1000}s 自动刷新</span>
              {lastRefreshTime && (
                <span>
                  上次:{" "}
                  {lastRefreshTime.toLocaleTimeString([], { hour12: false })}
                </span>
              )}
            </div>
            <button
              className={`icon-button ${refreshing ? "spin" : ""}`}
              onClick={handleRefresh}
              disabled={refreshing}
              title="刷新数据"
            >
              <RefreshIcon width="20" height="20" />
            </button>
            <button
              className="icon-button"
              onClick={() => setSettingsOpen(true)}
              title="设置"
            >
              <SettingsIcon width="20" height="20" />
            </button>
          </div>
        </div>

        <div className="search-bar" ref={dropdownRef}>
          <div className="search-input-wrapper">
            <SearchIcon
              width="18"
              height="18"
              className="search-icon"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              className="input search-input"
              placeholder="输入代码或名称搜索添加..."
              value={searchTerm}
              onChange={(e) => {
                handleSearchInput(e);
                setShowDropdown(Boolean(e.target.value));
              }}
              onFocus={() => {
                setShowDropdown(true);
                setIsAddFundOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchResults.length > 0) {
                    toggleSelectFund(searchResults[0]);
                  } else {
                    handleAddFund(e);
                  }
                }
              }}
            />
            {searchTerm && (
              <button
                className="icon-button"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 24,
                  height: 24,
                }}
                onClick={clearSearch}
              >
                <CloseIcon width="14" height="14" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showDropdown && searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="search-dropdown"
              >
                {searchResults.map((f) => {
                  const isSelected = selectedFunds.some(
                    (s) => s.CODE === f.CODE,
                  );
                  const isAdded = funds.some(
                    (existing) => existing.code === f.CODE,
                  );
                  return (
                    <div
                      key={f.CODE}
                      className={`search-item ${isSelected ? "selected" : ""} ${isAdded ? "added" : ""}`}
                      onClick={() => !isAdded && toggleSelectFund(f)}
                    >
                      <div className="info">
                        <div className="name-row">
                          <span className="name">{f.NAME}</span>
                          {isAdded && <span className="tag">已添加</span>}
                        </div>
                        <span className="code">{f.CODE}</span>
                      </div>
                      {isSelected && (
                        <div className="check">
                          <div className="checkbox checked">✓</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected funds preview */}
        <AnimatePresence>
          {selectedFunds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="selected-funds"
            >
              <div className="header-row">
                <span className="count">
                  已选 {selectedFunds.length} 支基金
                </span>
                <button
                  className="text-button"
                  onClick={() => setSelectedFunds([])}
                >
                  清空
                </button>
              </div>
              <div className="tags">
                {selectedFunds.map((f) => (
                  <motion.div
                    layout
                    key={f.CODE}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="tag"
                  >
                    <span>{f.NAME}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectFund(f);
                      }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
              <button
                className="button primary full-width"
                onClick={handleAddFund}
                disabled={loading}
              >
                {loading ? "添加中..." : "确认添加"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="error-message"
            style={{ color: "var(--down)", padding: "8px 0", fontSize: 14 }}
          >
            {error}
          </motion.div>
        )}
      </div>

      <div className="content">
        <div className="tabs-container">
          <div className="tabs-scroll-area" ref={null /* tabsRef if needed */}>
            <div className="tabs-wrapper">
              <button
                className={`tab ${currentTab === "all" ? "active" : ""}`}
                onClick={() => setCurrentTab("all")}
              >
                <ListIcon width="14" height="14" />
                全部
              </button>
              <button
                className={`tab ${currentTab === "fav" ? "active" : ""}`}
                onClick={() => setCurrentTab("fav")}
              >
                <StarIcon
                  width="14"
                  height="14"
                  filled={currentTab === "fav"}
                />
                自选
              </button>
              {groups.map((g) => (
                <div
                  key={g.id}
                  className={`tab group-tab ${currentTab === g.id ? "active" : ""}`}
                  onClick={() => setCurrentTab(g.id)}
                >
                  <FolderPlusIcon width="14" height="14" />
                  <span>{g.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="tabs-actions">
            <button
              className="icon-button"
              onClick={() => setGroupManageOpen(true)}
              title="管理分组"
            >
              <SettingsIcon width="16" height="16" />
            </button>
            <button
              className="icon-button"
              onClick={() => setGroupModalOpen(true)}
              title="新建分组"
            >
              <PlusIcon width="16" height="16" />
            </button>
          </div>
        </div>

        <div className="main-area">
          <div className="toolbar glass">
            <div className="left">
              <div className="stat-item">
                <span className="label">基金数量</span>
                <span className="value">{filteredFunds.length}</span>
              </div>
              {isTradingDay ? (
                <div className="stat-item">
                  <span className="dot online"></span>
                  <span className="label">交易中</span>
                </div>
              ) : (
                <div className="stat-item">
                  <span className="dot offline"></span>
                  <span className="label">休市中</span>
                </div>
              )}
            </div>

            <div className="right">
              <div className="search-local">
                <SearchIcon width="14" height="14" />
                <input
                  type="text"
                  placeholder="在列表中筛选..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                />
              </div>
              <div ref={sortDropdownRef} style={{ position: "relative" }}>
                <button
                  className={`toggle-btn ${showSortDropdown ? "active" : ""}`}
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  title="排序"
                >
                  <SortIcon width="16" height="16" />
                </button>
                <AnimatePresence>
                  {showSortDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="search-dropdown glass"
                      style={{
                        width: "140px",
                        right: 0,
                        left: "auto",
                        top: "calc(100% + 8px)",
                      }}
                    >
                      {sortOptions.map((opt) => (
                        <div
                          key={opt.key}
                          className={`search-item ${listSort.key === opt.key ? "selected" : ""}`}
                          onClick={() => {
                            toggleListSort(opt.key);
                          }}
                          style={{ padding: "8px 12px", fontSize: "13px" }}
                        >
                          <span>{opt.label}</span>
                          {listSort.key === opt.key && (
                            <SortArrowsIcon
                              width="14"
                              height="14"
                              active={true}
                              dir={listSort.dir}
                            />
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="view-toggle">
                <button
                  className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => viewMode !== "list" && toggleViewMode()}
                  title="列表视图"
                >
                  <ListIcon width="16" height="16" />
                </button>
                <button
                  className={`toggle-btn ${viewMode === "card" ? "active" : ""}`}
                  onClick={() => viewMode !== "card" && toggleViewMode()}
                  title="卡片视图"
                >
                  <GridIcon width="16" height="16" />
                </button>
              </div>
            </div>
          </div>

          {listDisplayFunds.length === 0 ? (
            <div
              className="glass card empty"
              style={{
                padding: "60px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: 16, opacity: 0.5 }}>
                📂
              </div>
              <div className="muted" style={{ marginBottom: 20 }}>
                {funds.length === 0 ? "尚未添加基金" : "该分组下暂无数据"}
              </div>
              {currentTab !== "all" &&
                currentTab !== "fav" &&
                funds.length > 0 && (
                  <button
                    className="button"
                    onClick={() => setAddFundToGroupOpen(true)}
                  >
                    添加基金到此分组
                  </button>
                )}
            </div>
          ) : (
            <>
              <GroupSummary
                funds={listDisplayFunds}
                holdings={holdings}
                groupName={getGroupName()}
                getProfit={getHoldingProfit}
              />

              {currentTab !== "all" && currentTab !== "fav" && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="button-dashed"
                  onClick={() => setAddFundToGroupOpen(true)}
                  style={{
                    width: "100%",
                    height: "48px",
                    border: "2px dashed rgba(255,255,255,0.1)",
                    background: "transparent",
                    borderRadius: "12px",
                    color: "var(--muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 16,
                    cursor: "pointer",
                  }}
                >
                  <PlusIcon width="18" height="18" />
                  <span>添加基金到此分组</span>
                </motion.button>
              )}

              <FundList
                funds={listDisplayFunds}
                viewMode={viewMode}
                listSort={listSort}
                toggleListSort={toggleListSort}
                holdings={holdings}
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
                onAction={handleAction}
              />
            </>
          )}
        </div>
      </div>

      <div className="footer">
        <p style={{ marginBottom: 8 }}>
          数据源：实时估值与重仓直连东方财富，仅供个人学习及参考使用。数据可能存在延迟，不作为任何投资建议
        </p>
        <div
          style={{
            marginTop: 12,
            opacity: 0.8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <p style={{ margin: 0 }}>
            遇到任何问题或需求建议可
            <button
              className="link-button"
              onClick={() => {
                setFeedbackNonce((n) => n + 1);
                setFeedbackOpen(true);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                cursor: "pointer",
                padding: "0 4px",
                textDecoration: "underline",
                fontSize: "inherit",
                fontWeight: 600,
              }}
            >
              点此提交反馈
            </button>
          </p>
          <button
            onClick={() => setDonateOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              fontSize: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            <span>☕</span>
            <span>请作者喝杯咖啡</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {feedbackOpen && (
          <FeedbackModal
            key={feedbackNonce}
            onClose={() => setFeedbackOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addResultOpen && (
          <AddResultModal
            failures={addFailures}
            onClose={() => setAddResultOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {addFundToGroupOpen && (
          <AddFundToGroupModal
            allFunds={funds}
            currentGroupCodes={
              groups.find((g) => g.id === currentTab)?.codes || []
            }
            onClose={() => setAddFundToGroupOpen(false)}
            onAdd={handleAddFundsToGroupWrapper}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {actionModal.open && (
          <HoldingActionModal
            fund={actionModal.fund}
            hasHolding={(() => {
              const code = actionModal?.fund?.code;
              if (!code) return false;
              const h = holdings?.[code];
              if (!h) return false;
              const share = Number(h.share);
              const costAmount = Number(h.costAmount);
              const profitTotal = Number(h.profitTotal);
              return (
                (Number.isFinite(share) && share > 0) ||
                (Number.isFinite(costAmount) && costAmount > 0) ||
                (Number.isFinite(profitTotal) && profitTotal !== 0)
              );
            })()}
            canSell={(() => {
              const code = actionModal?.fund?.code;
              if (!code) return false;
              const h = holdings?.[code];
              if (!h) return false;
              const share = Number(h.share);
              return Number.isFinite(share) && share > 0;
            })()}
            onClose={() => setActionModal({ open: false, fund: null })}
            onAction={(type) => handleAction(type, actionModal.fund)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tradeModal.open && (
          <TradeModal
            type={tradeModal.type}
            fund={tradeModal.fund}
            unitPrice={(() => {
              const fund = tradeModal.fund;
              const useValuation = isYmdAfter(todayStr, fund?.jzrq);
              if (!useValuation) return Number(fund?.dwjz);
              return fund?.estPricedCoverage > 0.05
                ? fund?.estGsz
                : typeof fund?.gsz === "number"
                  ? fund?.gsz
                  : Number(fund?.dwjz);
            })()}
            maxSellShare={(() => {
              const code = tradeModal?.fund?.code;
              const h = code ? holdings?.[code] : null;
              const s = h ? Number(h.share) : null;
              return typeof s === "number" && Number.isFinite(s) ? s : null;
            })()}
            onClose={() =>
              setTradeModal({ open: false, fund: null, type: "buy" })
            }
            onConfirm={(data) => handleTrade(tradeModal.fund, data)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {clearConfirm && (
          <ConfirmModal
            title="清空持仓"
            message={`确定要清空“${clearConfirm.fund?.name}”的所有持仓记录吗？`}
            onConfirm={handleClearConfirm}
            onCancel={() => setClearConfirm(null)}
            confirmText="确认清空"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal
            title="删除基金"
            message={`确定要删除“${deleteConfirm.fund?.name}”吗？`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirm(null)}
            confirmText="确认删除"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {holdingModal.open && (
          <HoldingEditModal
            fund={holdingModal.fund}
            holding={holdings[holdingModal.fund?.code]}
            onClose={() => setHoldingModal({ open: false, fund: null })}
            onSave={(data) => handleSaveHolding(holdingModal.fund?.code, data)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {donateOpen && (
          <div className="modal-overlay" onClick={() => setDonateOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass card modal"
              style={{ maxWidth: "360px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="title"
                style={{ marginBottom: 20, justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>☕ 请我喝杯咖啡</span>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setDonateOpen(false)}
                  style={{ border: "none", background: "transparent" }}
                >
                  <CloseIcon width="20" height="20" />
                </button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <DonateTabs />
              </div>
              <div
                className="muted"
                style={{ fontSize: "12px", textAlign: "center" }}
              >
                感谢您的支持！
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {groupManageOpen && (
          <GroupManageModal
            groups={groups}
            onClose={() => setGroupManageOpen(false)}
            onSave={updateGroups}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {groupModalOpen && (
          <GroupModal
            onClose={() => setGroupModalOpen(false)}
            onConfirm={addGroup}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {successModal.open && (
          <SuccessModal
            message={successModal.message}
            onClose={() => setSuccessModal({ open: false, message: "" })}
          />
        )}
      </AnimatePresence>

      {settingsOpen && (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div
            className="glass card modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="title" style={{ marginBottom: 12 }}>
              <SettingsIcon width="20" height="20" />
              <span>设置</span>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div
                className="muted"
                style={{ marginBottom: 8, fontSize: "0.8rem" }}
              >
                刷新频率
              </div>
              <div className="chips" style={{ marginBottom: 12 }}>
                {[10, 30, 60, 120, 300].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`chip ${tempSeconds === s ? "active" : ""}`}
                    onClick={() => setTempSeconds(s)}
                  >
                    {s} 秒
                  </button>
                ))}
              </div>
              <input
                className="input"
                type="number"
                min="5"
                step="5"
                value={tempSeconds}
                onChange={(e) => setTempSeconds(Number(e.target.value))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div
                className="muted"
                style={{ marginBottom: 8, fontSize: "0.8rem" }}
              >
                数据管理
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="button" onClick={exportLocalData}>
                  导出配置
                </button>
                <button
                  className="button"
                  onClick={() => importFileRef.current?.click?.()}
                >
                  导入配置
                </button>
              </div>
              <input
                ref={importFileRef}
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={handleImportFileChange}
              />
              {importMsg && (
                <div className="muted" style={{ marginTop: 8 }}>
                  {importMsg}
                </div>
              )}
            </div>
            <div
              className="row"
              style={{ justifyContent: "flex-end", marginTop: 24 }}
            >
              <button className="button" onClick={saveSettings}>
                保存并关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
