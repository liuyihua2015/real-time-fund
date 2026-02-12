import { useState, useEffect, useCallback } from "react";

export function useGroups() {
  const [favorites, setFavorites] = useState(new Set());
  const [groups, setGroups] = useState([]); // [{ id, name, codes: [] }]
  const [currentTab, setCurrentTab] = useState("all");

  // Load initial state
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTab = sessionStorage.getItem("fund_current_tab");
        if (savedTab) setCurrentTab(savedTab);
        
        const savedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        if (Array.isArray(savedFavorites)) {
          setFavorites(new Set(savedFavorites));
        }

        const savedGroups = JSON.parse(localStorage.getItem("groups") || "[]");
        if (Array.isArray(savedGroups)) {
          setGroups(savedGroups);
        }
      } catch (e) {
        console.error("Failed to load groups/favorites", e);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("fund_current_tab", currentTab);
  }, [currentTab]);

  const toggleFavorite = useCallback((code) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      localStorage.setItem("favorites", JSON.stringify(Array.from(next)));
      if (next.size === 0 && currentTab === "fav") setCurrentTab("all");
      return next;
    });
  }, [currentTab]);

  const replaceFavorites = useCallback(
    (codes) => {
      const next = new Set(Array.isArray(codes) ? codes.filter(Boolean) : []);
      setFavorites(next);
      localStorage.setItem("favorites", JSON.stringify(Array.from(next)));
      if (next.size === 0 && currentTab === "fav") setCurrentTab("all");
    },
    [currentTab],
  );

  const addGroup = useCallback((name) => {
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      codes: [],
    };
    setGroups((prev) => {
      const next = [...prev, newGroup];
      localStorage.setItem("groups", JSON.stringify(next));
      return next;
    });
    setCurrentTab(newGroup.id);
  }, []);

  const removeGroup = useCallback((id) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      localStorage.setItem("groups", JSON.stringify(next));
      return next;
    });
    if (currentTab === id) setCurrentTab("all");
  }, [currentTab]);

  const updateGroups = useCallback((newGroups) => {
    setGroups(newGroups);
    localStorage.setItem("groups", JSON.stringify(newGroups));
    // If current tab is deleted, switch to all
    if (
      currentTab !== "all" &&
      currentTab !== "fav" &&
      !newGroups.find((g) => g.id === currentTab)
    ) {
      setCurrentTab("all");
    }
  }, [currentTab]);

  const addFundsToGroup = useCallback((groupId, codes) => {
    if (!codes || codes.length === 0) return;
    setGroups((prev) => {
      const next = prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            codes: Array.from(new Set([...g.codes, ...codes])),
          };
        }
        return g;
      });
      localStorage.setItem("groups", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFundFromGroup = useCallback((groupId, code) => {
    setGroups((prev) => {
      const next = prev.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            codes: g.codes.filter((c) => c !== code),
          };
        }
        return g;
      });
      localStorage.setItem("groups", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFundInGroup = useCallback((groupId, code) => {
    setGroups((prev) => {
      const next = prev.map((g) => {
        if (g.id === groupId) {
          const has = g.codes.includes(code);
          return {
            ...g,
            codes: has ? g.codes.filter((c) => c !== code) : [...g.codes, code],
          };
        }
        return g;
      });
      localStorage.setItem("groups", JSON.stringify(next));
      return next;
    });
  }, []);

  return {
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
    setGroups // Exposed for useFunds removeFund callback if needed, though useFunds handles it via prop if we want
  };
}
