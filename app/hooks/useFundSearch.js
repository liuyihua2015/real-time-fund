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
      const res = await fetch(`/api/fund/suggest?key=${encodeURIComponent(val)}`);
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
