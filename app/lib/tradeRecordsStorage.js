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

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function makeId() {
  return `tr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function normalizeTradeRecord(input, codeFallback) {
  if (!isPlainObject(input)) return null;

  const id = typeof input.id === 'string' && input.id ? input.id : makeId();
  const code = typeof input.code === 'string' && input.code ? input.code : codeFallback || null;
  const fundName = typeof input.fundName === 'string' ? input.fundName : null;

  const type = input.type === 'sell' ? 'sell' : 'buy';
  const date = typeof input.date === 'string' ? input.date : null;

  const createdAt = Number(input.createdAt);
  const createdAtSafe = Number.isFinite(createdAt) ? createdAt : Date.now();

  const share = Number(input.share);
  const shareSafe = Number.isFinite(share) ? share : null;

  const amount = Number(input.amount);
  const amountSafe = Number.isFinite(amount) ? amount : null;

  const price = Number(input.price);
  const priceSafe = Number.isFinite(price) ? price : null;

  const feeRate = Number(input.feeRate);
  const feeRateSafe = Number.isFinite(feeRate) ? feeRate : null;

  const inputAmount = Number(input.inputAmount);
  const inputShare = Number(input.inputShare);

  return {
    id,
    code,
    fundName,
    type,
    date,
    createdAt: createdAtSafe,
    share: shareSafe,
    amount: amountSafe,
    price: priceSafe,
    feeRate: feeRateSafe,
    mode: input.mode || null,
    inputAmount: Number.isFinite(inputAmount) ? inputAmount : null,
    inputShare: Number.isFinite(inputShare) ? inputShare : null,
  };
}

export function normalizeTradeRecordsMap(input) {
  if (!isPlainObject(input)) return {};
  const next = {};
  for (const [code, records] of Object.entries(input)) {
    if (!code) continue;
    const list = ensureArray(records)
      .map((r) => normalizeTradeRecord(r, code))
      .filter(Boolean);
    next[code] = list;
  }
  return next;
}

export function loadTradeRecords() {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem('tradeRecords') || '{}';
  const parsed = safeParse(raw, {});
  return isPlainObject(parsed) ? parsed : {};
}

export function saveTradeRecords(records) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('tradeRecords', JSON.stringify(records || {}));
}

export function loadTradesByCode(code) {
  if (!code) return [];
  const all = loadTradeRecords();
  return ensureArray(all?.[code]);
}

export function appendTradeRecord(code, record) {
  if (!code || !record) return loadTradeRecords();
  const all = loadTradeRecords();
  const prev = ensureArray(all?.[code]);
  const next = { ...all, [code]: [...prev, record] };
  saveTradeRecords(next);
  return next;
}

export function removeTradesByCode(code) {
  if (!code) return loadTradeRecords();
  const all = loadTradeRecords();
  if (!Object.prototype.hasOwnProperty.call(all, code)) return all;
  const next = { ...all };
  delete next[code];
  saveTradeRecords(next);
  return next;
}

export function removeTradeRecordById(code, id) {
  if (!code || !id) return loadTradeRecords();
  const all = loadTradeRecords();
  const prev = ensureArray(all?.[code]);
  if (!prev.length) return all;
  const nextArr = prev.filter((r) => r?.id !== id);
  if (nextArr.length === prev.length) return all;
  const nextAll = { ...all, [code]: nextArr };
  saveTradeRecords(nextAll);
  return nextAll;
}

export function buildTradeRecord({ code, fundName, payload }) {
  const type = payload?.type === 'sell' ? 'sell' : 'buy';
  const date = typeof payload?.date === 'string' ? payload.date : null;

  const share = Number(payload?.share);
  const shareSafe = Number.isFinite(share) ? share : null;

  const price = Number(payload?.price);
  const priceSafe = Number.isFinite(price) ? price : null;

  const feeRate = Number(payload?.feeRate);
  const feeRateSafe = Number.isFinite(feeRate) ? feeRate : null;

  const totalCost = Number(payload?.totalCost);
  const redemptionAmount = Number(payload?.redemptionAmount);
  const amount =
    type === 'buy'
      ? Number.isFinite(totalCost)
        ? totalCost
        : null
      : Number.isFinite(redemptionAmount)
        ? redemptionAmount
        : null;

  const inputAmount = Number(payload?.inputAmount);
  const inputShare = Number(payload?.inputShare);

  return {
    id: makeId(),
    code: code || null,
    fundName: fundName || null,
    type,
    date,
    createdAt: Date.now(),
    share: shareSafe,
    amount,
    price: priceSafe,
    feeRate: feeRateSafe,
    mode: payload?.mode || null,
    inputAmount: Number.isFinite(inputAmount) ? inputAmount : null,
    inputShare: Number.isFinite(inputShare) ? inputShare : null,
  };
}

export function addTradeFromPayload(code, payload, { fundName } = {}) {
  const record = buildTradeRecord({ code, fundName, payload });
  if (!(record.share > 0)) return null;
  appendTradeRecord(code, record);
  return record;
}
