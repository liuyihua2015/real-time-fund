'use client';

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function loadHoldings() {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem('holdings') || '{}';
  const parsed = safeParse(raw, {});
  return isPlainObject(parsed) ? parsed : {};
}

export function saveHoldings(holdings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('holdings', JSON.stringify(holdings || {}));
}

export function upsertHolding(code, holding) {
  if (!code) return loadHoldings();
  const next = { ...loadHoldings() };
  const shouldDelete =
    holding &&
    Object.values(holding).every((v) => v === null || v === '' || v === undefined);
  if (!holding || shouldDelete) delete next[code];
  else next[code] = holding;
  saveHoldings(next);
  return next;
}

export function normalizeHolding(holding) {
  if (!holding || typeof holding !== 'object') return null;
  const share =
    holding.share == null || holding.share === '' ? null : Number(holding.share);
  const costAmount =
    holding.costAmount == null || holding.costAmount === ''
      ? null
      : Number(holding.costAmount);
  const profitTotal =
    holding.profitTotal == null || holding.profitTotal === ''
      ? null
      : Number(holding.profitTotal);

  const fallbackCost =
    holding.cost == null || holding.cost === '' ? null : Number(holding.cost);
  const costUnit =
    share && costAmount ? costAmount / share : share && fallbackCost ? fallbackCost : null;

  return {
    share: typeof share === 'number' && Number.isFinite(share) ? share : null,
    costAmount:
      typeof costAmount === 'number' && Number.isFinite(costAmount) ? costAmount : null,
    cost: typeof costUnit === 'number' && Number.isFinite(costUnit) ? costUnit : null,
    profitTotal:
      typeof profitTotal === 'number' && Number.isFinite(profitTotal) ? profitTotal : null
  };
}

