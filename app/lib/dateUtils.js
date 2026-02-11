export function formatYmd(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isYmdAfter(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length < 10 || b.length < 10) return false;
  return a.slice(0, 10) > b.slice(0, 10);
}
