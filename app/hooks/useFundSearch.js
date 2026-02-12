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
      // 兼容 GitHub Pages，直接请求东方财富接口 (JSONP)
      const cbName = `find_fund_${Date.now()}`;
      const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(val)}&callback=${cbName}`;

      const script = document.createElement("script");
      script.src = url;

      const p = new Promise((resolve, reject) => {
        window[cbName] = (data) => {
          delete window[cbName];
          script.remove();
          resolve(data);
        };
        script.onerror = () => {
          delete window[cbName];
          script.remove();
          reject(new Error("Search failed"));
        };
      });

      document.body.appendChild(script);
      const data = await p;

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

  const handleSearchInput = useCallback(
    (e) => {
      const val = e.target.value;
      setSearchTerm(val);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => performSearch(val), 300);
    },
    [performSearch],
  );

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
    clearSearch,
  };
}
