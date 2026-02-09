'use client';

import { useMemo, useRef, useState } from 'react';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatDate(iso) {
  if (!iso) return '—';
  return iso.replaceAll('-', '.');
}

function formatNumber(n, digits = 4) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function formatPct(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function buildPath(points, width, height, padding) {
  if (!points.length) return '';
  const xs = points.map((p) => p.i);
  const ys = points.map((p) => p.nav);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = Math.max(1, maxX - minX);
  const dy = Math.max(1e-6, maxY - minY);

  const x = (i) => padding + ((i - minX) / dx) * (width - padding * 2);
  const y = (v) => padding + (1 - (v - minY) / dy) * (height - padding * 2);

  return points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${x(p.i).toFixed(2)} ${y(p.nav).toFixed(2)}`)
    .join(' ');
}

function selectRange(history, range) {
  if (!Array.isArray(history)) return [];
  const trimmed = history.filter((p) => p?.date && Number.isFinite(p?.nav));
  if (!trimmed.length) return [];
  if (range === 'all') return trimmed;
  const days = range === '3m' ? 92 : range === '6m' ? 185 : 370;
  return trimmed.slice(Math.max(0, trimmed.length - days));
}

export default function FundChart({ history }) {
  const [range, setRange] = useState('6m');
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const data = useMemo(() => selectRange(history, range), [history, range]);

  const points = useMemo(() => {
    return data.map((p, i) => ({
      i,
      date: p.date,
      nav: Number(p.nav),
      changePct: Number.isFinite(p.changePct) ? Number(p.changePct) : null
    }));
  }, [data]);

  const dims = { width: 980, height: 260, padding: 18 };
  const path = useMemo(() => buildPath(points, dims.width, dims.height, dims.padding), [points]);

  const latest = points.length ? points[points.length - 1] : null;
  const first = points.length ? points[0] : null;
  const totalChangePct = latest && first ? ((latest.nav / first.nav - 1) * 100) : null;

  const onMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const t = clamp((px - dims.padding) / Math.max(1, rect.width - dims.padding * 2), 0, 1);
    const i = Math.round(t * (points.length - 1));
    setHoverIndex(clamp(i, 0, points.length - 1));
  };

  const onLeave = () => setHoverIndex(null);

  const hovered = hoverIndex != null ? points[hoverIndex] : latest;
  const up = Number.isFinite(totalChangePct) ? totalChangePct > 0 : false;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 850, letterSpacing: 0.12 }}>净值走势</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(229,231,235,0.7)' }}>
            区间回报：<span style={{ fontWeight: 850, color: Number.isFinite(totalChangePct) ? (up ? 'var(--success)' : 'var(--danger)') : 'rgba(229,231,235,0.7)' }}>{formatPct(totalChangePct)}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(229,231,235,0.7)' }}>
            {hovered ? `${formatDate(hovered.date)}  ·  ${formatNumber(hovered.nav)}  ·  ${hovered.changePct != null ? formatPct(hovered.changePct) : '—'}` : '—'}
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: '3m', label: '近3月' },
            { key: '6m', label: '近6月' },
            { key: '1y', label: '近1年' },
            { key: 'all', label: '全部' }
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRange(t.key)}
              style={{
                appearance: 'none',
                border: '1px solid rgba(255,255,255,0.10)',
                background: range === t.key ? 'rgba(34,211,238,0.10)' : 'rgba(0,0,0,0.08)',
                color: range === t.key ? 'var(--text)' : 'rgba(229,231,235,0.72)',
                borderRadius: 999,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          width="100%"
          height="260"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          style={{
            display: 'block',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.16)',
            touchAction: 'none'
          }}
          role="img"
          aria-label="基金净值走势折线图"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="rgba(34,211,238,0.95)" />
              <stop offset="1" stopColor="rgba(96,165,250,0.55)" />
            </linearGradient>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="rgba(34,211,238,0.18)" />
              <stop offset="1" stopColor="rgba(34,211,238,0.00)" />
            </linearGradient>
          </defs>

          {points.length >= 2 ? (
            <>
              <path d={path} fill="none" stroke="url(#lineGrad)" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
              <path d={`${path} L ${dims.width - dims.padding} ${dims.height - dims.padding} L ${dims.padding} ${dims.height - dims.padding} Z`} fill="url(#fillGrad)" opacity="0.85" />
            </>
          ) : (
            <text x="50%" y="50%" textAnchor="middle" fill="rgba(229,231,235,0.6)" fontSize="12">暂无可用走势数据</text>
          )}

          {hoverIndex != null && points.length ? (
            (() => {
              const i = points[hoverIndex].i;
              const xs = points.map((p) => p.i);
              const ys = points.map((p) => p.nav);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);
              const dx = Math.max(1, maxX - minX);
              const dy = Math.max(1e-6, maxY - minY);
              const x = dims.padding + ((i - minX) / dx) * (dims.width - dims.padding * 2);
              const y = dims.padding + (1 - (points[hoverIndex].nav - minY) / dy) * (dims.height - dims.padding * 2);
              return (
                <>
                  <line x1={x} y1={dims.padding} x2={x} y2={dims.height - dims.padding} stroke="rgba(255,255,255,0.14)" />
                  <circle cx={x} cy={y} r="4.5" fill="rgba(34,211,238,0.95)" />
                  <circle cx={x} cy={y} r="9" fill="rgba(34,211,238,0.18)" />
                </>
              );
            })()
          ) : null}
        </svg>
      </div>
    </div>
  );
}

