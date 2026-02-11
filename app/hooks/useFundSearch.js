import { useState, useRef, useCallback } from "react";

export function useFundSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFunds, setSelectedFunds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const performSearch = useCallback(async (val) => {
    if (!val) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const isCode = /^\d+$/.test(val);
      // 优先搜索代码
      if (isCode) {
        // 尝试搜索多个接口
        // 1. 腾讯接口 (智能提示)
        const tencentUrl = `https://smartbox.gtimg.cn/s3/?q=${val}&t=fund`;
        // JSONP handling... simplified for fetch here if possible, but browser blocks cross-origin JSONP usually without script tag
        // Assuming we use the same proxy or method as before
        // For simplicity, let's reuse the logic from original page or similar
        // But since this is a hook, we can keep the logic here.
        
        // Use local API proxy if available or just basic fetch if CORS allows (it usually doesn't for these)
        // Original code used `fetch` to a proxy or direct if allowed. 
        // Original code used `fetch` to `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx` via proxy?
        // No, original code used `fetch` to `https://fundsuggest.eastmoney.com...` directly? 
        // Let's check original code.
      } 
      
      // Let's copy the performSearch logic from page.jsx
      // It used fetch to eastmoney
      
      const ts = Date.now();
      const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(val)}&_=${ts}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data?.Datas)) {
        setSearchResults(data.Datas);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchInput = useCallback((e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
  }, [performSearch]);

  const toggleSelectFund = useCallback((fund) => {
    setSelectedFunds((prev) => {
      const exists = prev.find((f) => f.CODE === fund.CODE);
      if (exists) {
        return prev.filter((f) => f.CODE !== fund.CODE);
      }
      return [...prev, fund];
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedFunds([]);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    selectedFunds,
    setSelectedFunds,
    isSearching,
    handleSearchInput,
    toggleSelectFund,
    clearSearch
  };
}
