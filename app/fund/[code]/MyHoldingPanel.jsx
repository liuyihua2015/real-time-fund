'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import HoldingEditModal from '../../components/HoldingEditModal';
import { loadHoldings, saveHoldings, normalizeHolding } from '../../lib/holdingsStorage';
import styles from './fund-detail.module.css';

function formatMoneyAbs(n) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(2);
}

function formatMoneySigned(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}`;
}

function formatPctSigned(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function formatNumber(n, digits = 2) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function pickChangeClass(stylesObj, n) {
  if (!Number.isFinite(n) || n === 0) return '';
  return n > 0 ? stylesObj.up : stylesObj.down;
}

export default function MyHoldingPanel({ fund, currentUnit, navUnit }) {
  const code = fund?.code;
  const [holding, setHolding] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const next = loadHoldings();
    setHolding(normalizeHolding(next?.[code]));
  }, [code]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key !== 'holdings') return;
      setHolding(normalizeHolding(loadHoldings()?.[code]));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [code]);

  const metrics = useMemo(() => {
    const share = holding?.share;
    const costAmount = holding?.costAmount;
    const profitTotal = holding?.profitTotal;
    const costUnit =
      typeof share === 'number' && share > 0 && typeof costAmount === 'number'
        ? costAmount / share
        : null;
    const value =
      typeof share === 'number' && Number.isFinite(currentUnit) ? share * currentUnit : null;
    const floatProfit =
      typeof value === 'number' && typeof costAmount === 'number' ? value - costAmount : null;
    const floatProfitPct =
      typeof value === 'number' && typeof costAmount === 'number' && costAmount > 0
        ? (value / costAmount - 1) * 100
        : null;
    const todayProfit =
      typeof share === 'number' &&
      Number.isFinite(currentUnit) &&
      Number.isFinite(navUnit)
        ? share * (currentUnit - navUnit)
        : null;

    return {
      share,
      costAmount,
      profitTotal,
      costUnit,
      value,
      floatProfit,
      floatProfitPct,
      todayProfit
    };
  }, [holding, currentUnit, navUnit]);

  const hasHolding = !!(metrics.share && metrics.costAmount);

  const clearHolding = () => {
    if (!code) return;
    const next = loadHoldings();
    delete next[code];
    saveHoldings(next);
    setHolding(null);
  };

  const onSave = (data) => {
    const normalized = normalizeHolding(data);
    if (!code) return;
    const next = loadHoldings();
    next[code] = normalized;
    saveHoldings(next);
    setHolding(normalized);
  };

  return (
    <div className={styles.myHoldBox}>
      <div className={styles.myHoldHeader}>
        <div>
          <div className={styles.myHoldTitle}>我的持仓</div>
          <div className={styles.myHoldSubtitle}>本地数据（与首页同步）</div>
        </div>
        <div className={styles.myHoldActions}>
          <button type="button" className={styles.myHoldBtn} onClick={() => setOpen(true)}>
            {hasHolding ? '编辑' : '设置'}
          </button>
          {hasHolding ? (
            <button type="button" className={styles.myHoldBtnDanger} onClick={clearHolding}>
              清除
            </button>
          ) : null}
        </div>
      </div>

      {hasHolding ? (
        <>
          <div className={styles.myHoldHero} style={{ fontFamily: 'var(--font-mono)' }}>
            <div className={styles.myHoldHeroK}>浮动盈亏</div>
            <div className={`${styles.myHoldHeroV} ${pickChangeClass(styles, metrics.floatProfit)}`}>
              ¥{formatMoneySigned(metrics.floatProfit)}
              <span style={{ opacity: 0.72, marginLeft: 10, fontSize: 13 }}>
                ({formatPctSigned(metrics.floatProfitPct)})
              </span>
            </div>
            <div className={styles.myHoldHeroMeta} style={{ fontFamily: 'var(--font-mono)' }}>
              <span>当前市值 ¥{formatMoneyAbs(metrics.value)}</span>
              <span>成本金额 ¥{formatMoneyAbs(metrics.costAmount)}</span>
              <span>份额 {formatNumber(metrics.share, 2)}</span>
            </div>
          </div>

          <div className={styles.myHoldGrid} style={{ fontFamily: 'var(--font-mono)' }}>
            <div className={styles.myHoldItem}>
              <div className={styles.myHoldK}>成本单价</div>
              <div className={styles.myHoldV}>{formatNumber(metrics.costUnit, 4)}</div>
            </div>
            <div className={styles.myHoldItem}>
              <div className={styles.myHoldK}>当日盈亏</div>
              <div className={`${styles.myHoldV} ${pickChangeClass(styles, metrics.todayProfit)}`}>
                ¥{formatMoneySigned(metrics.todayProfit)}
              </div>
            </div>
            <div className={styles.myHoldItem} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.myHoldK}>已录入持有收益</div>
              <div className={`${styles.myHoldV} ${pickChangeClass(styles, metrics.profitTotal)}`}>
                ¥{formatMoneySigned(metrics.profitTotal)}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={styles.myHoldEmpty}>
          <div style={{ marginBottom: 6 }}>未设置该基金的持仓数据。</div>
          <div style={{ opacity: 0.72, fontSize: 12 }}>
            这里会读取首页“设置持仓”的本地数据，并在详情页展示估算市值与盈亏。
          </div>
        </div>
      )}

      <AnimatePresence>
        {open ? (
          <HoldingEditModal
            fund={fund}
            holding={holding}
            onClose={() => setOpen(false)}
            onSave={onSave}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
