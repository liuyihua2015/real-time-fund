'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import HoldingEditModal from '../../components/HoldingEditModal';
import HoldingActionModal from '../../components/HoldingActionModal';
import TradeModalLite from '../../components/TradeModalLite';
import ConfirmModal from '../../components/ConfirmModal';
import { loadHoldings, saveHoldings, normalizeHolding } from '../../lib/holdingsStorage';

function pickUpDownClass(n) {
  if (!Number.isFinite(n) || n === 0) return '';
  return n > 0 ? 'up' : 'down';
}

function formatMoneyAbs(n) {
  if (!Number.isFinite(n)) return '—';
  return `¥${n.toFixed(2)}`;
}

function formatMoneySigned(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}`;
}

function formatNumber(n, digits = 4) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function formatPctSigned(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function TrashIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6l1-2h6l1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsTinyIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a7.97 7.97 0 0 0 .1-2l2-1.5-2-3.5-2.3.5a8.02 8.02 0 0 0-1.7-1l-.4-2.3h-4l-.4 2.3a8.02 8.02 0 0 0-1.7 1l-2.3-.5-2 3.5 2 1.5a7.97 7.97 0 0 0 .1 2l-2 1.5 2 3.5 2.3-.5a8.02 8.02 0 0 0 1.7 1l.4 2.3h4l.4-2.3a8.02 8.02 0 0 0 1.7-1l2.3.5 2-3.5-2-1.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function readFavorites() {
  try {
    const raw = localStorage.getItem('favorites') || '[]';
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeFavorites(set) {
  try {
    localStorage.setItem('favorites', JSON.stringify(Array.from(set)));
  } catch {}
}

function removeFundFromLocalList(code) {
  try {
    const raw = localStorage.getItem('funds') || '[]';
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return;
    const next = arr.filter((f) => f?.code !== code);
    localStorage.setItem('funds', JSON.stringify(next));
  } catch {}
}

export default function FundCardDetailClient({ code }) {
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorited, setFavorited] = useState(false);
  const [topOpen, setTopOpen] = useState(true);
  const [holdingModalOpen, setHoldingModalOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [tradeModal, setTradeModal] = useState({ open: false, type: 'buy' });
  const [holding, setHolding] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const set = readFavorites();
    setFavorited(set.has(code));
  }, [code]);

  useEffect(() => {
    setHolding(normalizeHolding(loadHoldings()?.[code]));
  }, [code]);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError('');
    fetch(`/api/fund/${code}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((json) => {
        if (aborted) return;
        setDetail(json);
        setLoading(false);
      })
      .catch(() => {
        if (aborted) return;
        setError('加载失败');
        setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [code]);

  const navUnit = detail?.nav?.navUnit;
  const estUnit = detail?.nav?.estimateUnit;
  const estChangePct = detail?.nav?.estimateChangePct;
  const navDate = detail?.nav?.navDate;
  const estTime = detail?.nav?.estimateTime;
  const currentUnit = Number.isFinite(estUnit) ? estUnit : navUnit;

  const holdingComputed = useMemo(() => {
    const share = holding?.share;
    const costAmount = holding?.costAmount;
    const costUnit =
      typeof share === 'number' && share > 0 && typeof costAmount === 'number'
        ? costAmount / share
        : null;
    const amount =
      typeof share === 'number' && Number.isFinite(currentUnit) ? share * currentUnit : null;
    const todayProfit =
      typeof share === 'number' && Number.isFinite(currentUnit) && Number.isFinite(navUnit)
        ? share * (currentUnit - navUnit)
        : null;
    const holdingProfit =
      typeof amount === 'number' && typeof costAmount === 'number' ? amount - costAmount : null;
    const holdingProfitPct =
      typeof holdingProfit === 'number' && typeof costAmount === 'number' && costAmount > 0
        ? (holdingProfit / costAmount) * 100
        : null;

    const hist = Array.isArray(detail?.history) ? detail.history : [];
    const last = hist.length ? hist[hist.length - 1] : null;
    const prev = hist.length >= 2 ? hist[hist.length - 2] : null;
    const yesterdayProfit =
      typeof share === 'number' && Number.isFinite(last?.nav) && Number.isFinite(prev?.nav)
        ? share * (Number(last.nav) - Number(prev.nav))
        : null;

    return {
      share,
      costAmount,
      costUnit,
      amount,
      todayProfit,
      holdingProfit,
      holdingProfitPct,
      yesterdayProfit
    };
  }, [holding, currentUnit, navUnit, detail?.history]);

  const onToggleFavorite = () => {
    const set = readFavorites();
    const next = new Set(set);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    writeFavorites(next);
    setFavorited(next.has(code));
  };

  const doDelete = () => {
    removeFundFromLocalList(code);
    const fav = readFavorites();
    if (fav.has(code)) {
      fav.delete(code);
      writeFavorites(fav);
    }

    try {
      const raw = localStorage.getItem('groups') || '[]';
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const next = arr.map((g) => ({
          ...g,
          codes: Array.isArray(g?.codes) ? g.codes.filter((c) => c !== code) : []
        }));
        localStorage.setItem('groups', JSON.stringify(next));
      }
    } catch {}

    try {
      const raw = localStorage.getItem('holdings') || '{}';
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') {
        delete obj[code];
        localStorage.setItem('holdings', JSON.stringify(obj));
      }
    } catch {}

    router.push('/');
  };

  const onSaveHolding = (data) => {
    const normalized = normalizeHolding(data);
    const all = loadHoldings();
    const next = { ...all, [code]: normalized };
    saveHoldings(next);
    setHolding(normalized);
  };

  const clearHolding = () => {
    const all = loadHoldings();
    delete all[code];
    saveHoldings(all);
    setHolding(null);
  };

  const applyTrade = (payload) => {
    const current = holding || {
      share: 0,
      costAmount: 0,
      cost: 0,
      profitTotal: null
    };

    const curShare = typeof current.share === 'number' && Number.isFinite(current.share) ? current.share : 0;
    const curCostAmount =
      typeof current.costAmount === 'number' && Number.isFinite(current.costAmount)
        ? current.costAmount
        : typeof current.cost === 'number' && Number.isFinite(current.cost)
          ? current.cost * curShare
          : 0;
    const curCostUnit =
      typeof current.cost === 'number' && Number.isFinite(current.cost)
        ? current.cost
        : curShare > 0
          ? curCostAmount / curShare
          : 0;

    if (payload.type === 'buy') {
      const buyShare = Number(payload.share);
      const buyCost = Number(payload.totalCost);
      if (!(buyShare > 0) || !(buyCost > 0)) return;
      const newShare = curShare + buyShare;
      const nextCostAmount = curCostAmount + buyCost;
      const newCostUnit = newShare > 0 ? nextCostAmount / newShare : 0;
      onSaveHolding({
        share: newShare,
        costAmount: nextCostAmount,
        cost: newCostUnit,
        profitTotal: typeof current.profitTotal === 'number' ? current.profitTotal : null
      });
    } else {
      const sellShare = Number(payload.share);
      if (!(sellShare > 0)) return;
      const newShare = Math.max(0, curShare - sellShare);
      const newCostUnit = newShare === 0 ? 0 : curCostUnit;
      const nextCostAmount = newCostUnit * newShare;
      if (newShare === 0) {
        clearHolding();
      } else {
        onSaveHolding({
          share: newShare,
          costAmount: nextCostAmount,
          cost: newCostUnit,
          profitTotal: typeof current.profitTotal === 'number' ? current.profitTotal : null
        });
      }
    }
  };

  const topHoldings = Array.isArray(detail?.holdings) ? detail.holdings.slice(0, 10) : [];

  if (loading) {
    return (
      <div className="container content">
        <div className="navbar glass">
          <div className="brand">
            <button type="button" className="icon-button" onClick={() => router.push('/')} aria-label="返回首页" title="返回首页">
              <ArrowLeftIcon width="18" height="18" />
            </button>
            <span>基估宝</span>
          </div>
          <div className="actions" />
        </div>
        <div className="glass card" style={{ padding: 18 }}>
          <div className="muted">加载中…</div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container content">
        <div className="navbar glass">
          <div className="brand">
            <button type="button" className="icon-button" onClick={() => router.push('/')} aria-label="返回首页" title="返回首页">
              <ArrowLeftIcon width="18" height="18" />
            </button>
            <span>基估宝</span>
          </div>
          <div className="actions" />
        </div>
        <div className="glass card" style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>加载失败</div>
          <div className="muted" style={{ marginBottom: 14 }}>请稍后再试</div>
          <div className="row" style={{ gap: 10 }}>
            <button className="button" type="button" onClick={() => router.refresh()}>重试</button>
            <Link className="button secondary" href="/" style={{ textDecoration: 'none' }}>返回列表</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container content">
      <div className="navbar glass">
        <div className="brand">
          <button type="button" className="icon-button" onClick={() => router.push('/')} aria-label="返回首页" title="返回首页">
            <ArrowLeftIcon width="18" height="18" />
          </button>
          <span>基估宝</span>
        </div>
        <div className="actions" />
      </div>
      <div className="glass card" style={{ cursor: 'default' }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <div className="title">
            <button
              type="button"
              className={`icon-button fav-button ${favorited ? 'active' : ''}`}
              title={favorited ? '取消自选' : '添加自选'}
              onClick={onToggleFavorite}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="title-text">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {detail.name || code}
              </span>
              <span className="muted">#{code}</span>
            </div>
          </div>

          <div className="actions">
            <div className="badge-v">
              <span>估值时间</span>
              <strong>{estTime || navDate || '—'}</strong>
            </div>
            <div className="row" style={{ gap: 4 }}>
              <button className="icon-button danger" title="删除" style={{ width: 28, height: 28 }} onClick={() => setDeleteConfirmOpen(true)}>
                <TrashIcon width="14" height="14" />
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="row" style={{ marginBottom: 14, alignItems: 'stretch' }}>
            <div
              className="stat"
              style={{ cursor: 'pointer', flexDirection: 'column', gap: 4, flex: '1 1 0%' }}
              onClick={() => setActionOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActionOpen(true)}
            >
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                持仓金额 <SettingsTinyIcon width="12" height="12" style={{ opacity: 0.7 }} />
              </span>
              <span className="value" style={{ fontSize: 24, lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
                {formatMoneyAbs(holdingComputed.amount)}
              </span>
            </div>
            <div className="stat" style={{ flexDirection: 'column', gap: 4, flex: '1 1 0%', alignItems: 'flex-end', textAlign: 'right' }}>
              <span className="label">当日盈亏</span>
              <span className={`value ${pickUpDownClass(holdingComputed.todayProfit)}`} style={{ fontSize: 22, lineHeight: 1.1, fontFamily: 'var(--font-mono)' }}>
                {formatMoneySigned(holdingComputed.todayProfit)}
              </span>
            </div>
          </div>

          <div className="row" style={{ marginBottom: 14 }}>
            <div className="stat" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="label">昨日收益</span>
              <span className={`value ${pickUpDownClass(holdingComputed.yesterdayProfit)}`} style={{ fontFamily: 'var(--font-mono)' }}>
                {formatMoneySigned(holdingComputed.yesterdayProfit ?? 0)}
              </span>
            </div>
            <div className="stat" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="label">持有收益</span>
              <span className={`value ${pickUpDownClass(holdingComputed.holdingProfit)}`} style={{ fontFamily: 'var(--font-mono)' }}>
                {formatMoneySigned(holdingComputed.holdingProfit)}
              </span>
            </div>
            <div className="stat" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="label">持有收益率</span>
              <span className={`value ${pickUpDownClass(holdingComputed.holdingProfitPct)}`} style={{ fontFamily: 'var(--font-mono)' }}>
                {formatPctSigned(holdingComputed.holdingProfitPct)}
              </span>
            </div>
          </div>

          <div className="row" style={{ marginBottom: 14 }}>
            <div className="stat" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="label">持有份额</span>
              <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(holdingComputed.share, 2)}</span>
            </div>
            <div className="stat" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="label">持仓成本价</span>
              <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>{formatMoneyAbs(holdingComputed.costAmount)}</span>
            </div>
            <div className="stat" style={{ flexDirection: 'column', gap: 4 }}>
              <span className="label">持仓成本单价</span>
              <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>
                {Number.isFinite(holdingComputed.costUnit) ? `¥${formatNumber(holdingComputed.costUnit, 4)}` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <div className="stat" style={{ flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="label" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>单位净值</span>
            <span className="value" style={{ fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{formatNumber(navUnit, 4)}</span>
          </div>
          <div className="stat" style={{ flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="label" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>估值净值</span>
            <span className="value" style={{ fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{formatNumber(estUnit, 4)}</span>
          </div>
          <div className="stat" style={{ flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="label" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>估值涨跌幅</span>
            <span className={`value ${pickUpDownClass(estChangePct)}`} style={{ fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{formatPctSigned(estChangePct)}</span>
          </div>
        </div>

        <div className="title" style={{ marginBottom: 8, cursor: 'pointer', userSelect: 'none' }} onClick={() => setTopOpen((v) => !v)}>
          <div className="row" style={{ width: '100%', flex: '1 1 0%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>前10重仓股票</span>
              <ChevronIcon
                width="16"
                height="16"
                className="muted"
                style={{ transform: topOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
              />
            </div>
            <span className="muted">涨跌幅 / 占比</span>
          </div>
        </div>

        {topOpen ? (
          <div className="list" style={{ marginTop: 8 }}>
            {topHoldings.length ? (
              topHoldings.map((h) => (
                <div className="item" key={`${h.code || ''}-${h.name}`}>
                  <span className="name">{h.name}</span>
                  <div className="values">
                    {Number.isFinite(h.changePct) ? (
                      <span className={`badge ${pickUpDownClass(h.changePct)}`} style={{ marginRight: 8 }}>
                        {formatPctSigned(h.changePct)}
                      </span>
                    ) : null}
                    <span className="weight">{Number.isFinite(h.ratioPct) ? `${h.ratioPct.toFixed(2)}%` : '—'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="muted" style={{ padding: '8px 0' }}>暂无重仓数据</div>
            )}
          </div>
        ) : null}
      </div>

      <AnimatePresence>
        {actionOpen ? (
          <HoldingActionModal
            fund={{ code, name: detail?.name || code }}
            hasHolding={!!holding}
            onClose={() => setActionOpen(false)}
            onAction={(type) => {
              setActionOpen(false);
              if (type === 'buy' || type === 'sell') {
                setTradeModal({ open: true, type });
              } else if (type === 'edit') {
                setHoldingModalOpen(true);
              } else if (type === 'clear') {
                clearHolding();
              }
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {tradeModal.open ? (
          <TradeModalLite
            type={tradeModal.type}
            fund={{ code, name: detail?.name || code }}
            unitPrice={currentUnit}
            onClose={() => setTradeModal({ open: false, type: 'buy' })}
            onConfirm={(payload) => {
              applyTrade(payload);
              setTradeModal({ open: false, type: 'buy' });
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {holdingModalOpen ? (
          <HoldingEditModal
            fund={{ code, name: detail.name || code }}
            holding={holding}
            onClose={() => setHoldingModalOpen(false)}
            onSave={onSaveHolding}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmOpen ? (
          <ConfirmModal
            title="删除基金"
            message={`确定要删除“${detail?.name || code}”吗？将同时移除其持仓、自选和分组引用，此操作不可恢复。`}
            onConfirm={() => {
              setDeleteConfirmOpen(false);
              doDelete();
            }}
            onCancel={() => setDeleteConfirmOpen(false)}
            confirmText="确认删除"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
