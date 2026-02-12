'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../../components/ConfirmModal';
import {
  loadTradeRecords,
  loadTradesByCode,
  normalizeTradeRecord,
  removeTradeRecordById,
  saveTradeRecords,
} from '../../../lib/tradeRecordsStorage';

function formatMoney(n) {
  if (!Number.isFinite(n)) return '—';
  return `¥${n.toFixed(2)}`;
}

function formatNumber(n, digits = 2) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function formatTime(ms) {
  if (!Number.isFinite(ms)) return '';
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function tradeDateToTs(date) {
  if (!date) return 0;
  const m = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 0;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mm) || !Number.isFinite(dd)) return 0;
  return new Date(y, mm - 1, dd).getTime();
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function DownloadIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v10m0 0l4-4m-4 4l-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17v3h16v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21V11m0 0l4 4m-4-4l-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 7V4h16v3"
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
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 6l1-2h6l1 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 6l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TradesClient({ code }) {
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const importFileRef = useRef(null);
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => {
    setRecords(loadTradesByCode(code));
  }, [code]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key !== 'tradeRecords') return;
      setRecords(loadTradesByCode(code));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [code]);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
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
        setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [code]);

  const sorted = useMemo(() => {
    const arr = Array.isArray(records) ? [...records] : [];
    arr.sort((a, b) => {
      const ad = tradeDateToTs(a?.date);
      const bd = tradeDateToTs(b?.date);
      if (ad !== bd) return bd - ad;
      const ac = Number(a?.createdAt) || 0;
      const bc = Number(b?.createdAt) || 0;
      return bc - ac;
    });
    return arr;
  }, [records]);

  const summary = useMemo(() => {
    const buys = sorted.filter((r) => r?.type === 'buy').length;
    const sells = sorted.filter((r) => r?.type === 'sell').length;
    return { buys, sells, total: sorted.length };
  }, [sorted]);

  const exportTrades = () => {
    const data = {
      schemaVersion: 1,
      kind: 'fundTradeRecords',
      code,
      fundName: detail?.name || sorted?.[0]?.fundName || null,
      records: loadTradesByCode(code),
      exportTime: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fund-${code}-trades-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.target;
    const reader = new FileReader();
    reader.onload = (ev) => {
      let wrote = false;
      try {
        const raw = ev.target?.result;
        const data = JSON.parse(typeof raw === 'string' ? raw : '');
        if (!data || typeof data !== 'object') throw new Error('bad data');

        let imported = null;
        if (Array.isArray(data.records)) {
          imported = data.records;
        } else if (isPlainObject(data.tradeRecords) && Array.isArray(data.tradeRecords?.[code])) {
          imported = data.tradeRecords[code];
        }

        if (!Array.isArray(imported)) throw new Error('no records');

        const normalized = imported
          .map((r) => {
            const rr = normalizeTradeRecord(r, code);
            if (!rr) return null;
            if (!rr.fundName && detail?.name) return { ...rr, fundName: detail.name };
            return rr;
          })
          .filter(Boolean);

        const all = loadTradeRecords();
        const next = { ...(isPlainObject(all) ? all : {}), [code]: normalized };
        saveTradeRecords(next);
        wrote = true;
        setRecords(loadTradesByCode(code));
        setImportMsg(`已导入 ${normalized.length} 条记录`);
        setTimeout(() => setImportMsg(''), 1200);
      } catch (err) {
        if (wrote) {
          setImportMsg('导入完成');
          setTimeout(() => setImportMsg(''), 1200);
          return;
        }
        const name = err?.name || '';
        const msg = String(err?.message || '');
        const hint =
          name === 'QuotaExceededError' || msg.toLowerCase().includes('quota')
            ? '浏览器存储空间不足'
            : name === 'SyntaxError'
              ? 'JSON 格式错误'
              : msg
                ? msg
                : '格式错误';
        setImportMsg(`导入失败: ${hint}`);
        setTimeout(() => setImportMsg(''), 1500);
      }
    };
    reader.readAsText(file);
    inputEl.value = '';
  };

  return (
    <div className="ui-page">
      <AnimatePresence>
        {deleteConfirm ? (
          <ConfirmModal
            title="删除交易记录"
            message={`确认删除 ${deleteConfirm?.type === 'sell' ? '减仓' : '加仓'}（${
              deleteConfirm?.date || '—'
            }）这条记录？`}
            confirmText="确定删除"
            onCancel={() => setDeleteConfirm(null)}
            onConfirm={() => {
              if (deleteConfirm?.id) removeTradeRecordById(code, deleteConfirm.id);
              setRecords(loadTradesByCode(code));
              setDeleteConfirm(null);
            }}
          />
        ) : null}
      </AnimatePresence>

      <div className="ui-glass ui-panel" style={{ cursor: 'default' }}>
        <div className="row" style={{ marginBottom: 14, alignItems: 'flex-start' }}>
          <div className="row" style={{ justifyContent: 'flex-start', gap: 12 }}>
            <button
              type="button"
              className="ui-icon-button"
              onClick={() => router.push(`/fund/${code}`)}
              aria-label="返回基金详情"
              title="返回基金详情"
            >
              <ArrowLeftIcon width="18" height="18" />
            </button>
            <div className="title" style={{ margin: 0 }}>
              <div className="title-text">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {detail?.name || sorted?.[0]?.fundName || code}
                </span>
                <span className="muted">#{code}</span>
              </div>
            </div>
          </div>

          <div className="actions">
            <div className="badge-v">
              <span>记录数</span>
              <strong>
                {summary.total}
                <span className="muted" style={{ fontWeight: 500 }}>
                  {' '}
                  (加{summary.buys} / 减{summary.sells})
                </span>
              </strong>
            </div>
            <button
              type="button"
              className="ui-icon-button"
              title="导出交易记录"
              aria-label="导出交易记录"
              onClick={exportTrades}
            >
              <DownloadIcon width="18" height="18" />
            </button>
            <button
              type="button"
              className="ui-icon-button"
              title="导入交易记录"
              aria-label="导入交易记录"
              onClick={() => importFileRef.current?.click?.()}
            >
              <UploadIcon width="18" height="18" />
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />
          </div>
        </div>

        {importMsg ? (
          <div className="muted" style={{ marginBottom: 10 }}>
            {importMsg}
          </div>
        ) : null}

        {loading ? (
          <div className="muted">加载中…</div>
        ) : sorted.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((r) => {
              const isBuy = r?.type === 'buy';
              const amount = Number(r?.amount);
              const share = Number(r?.share);
              const price = Number(r?.price);
              const feeRate = Number(r?.feeRate);
              const createdAt = Number(r?.createdAt);
              const dateText = r?.date || '—';
              const canDelete = !!r?.id;
              return (
                <div
                  key={r?.id || `${r?.date}_${r?.type}_${r?.createdAt}`}
                  className="glass"
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="row" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{isBuy ? '📥' : '📤'}</span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 700 }}>
                          {isBuy ? '加仓' : '减仓'}{' '}
                          <span className="muted" style={{ fontWeight: 500 }}>
                            {dateText}
                          </span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          记录时间 {formatTime(createdAt)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {formatMoney(amount)}
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {isBuy ? '投入' : '到手'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="icon-button danger"
                        title="删除记录"
                        aria-label="删除记录"
                        style={{ width: 28, height: 28, opacity: canDelete ? 1 : 0.5 }}
                        disabled={!canDelete}
                        onClick={() => setDeleteConfirm(r)}
                      >
                        <TrashIcon width="14" height="14" />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 10,
                    }}
                  >
                    <div className="badge-v" style={{ width: '100%' }}>
                      <span>份额</span>
                      <strong>{formatNumber(share, 2)}</strong>
                    </div>
                    <div className="badge-v" style={{ width: '100%' }}>
                      <span>净值</span>
                      <strong>{formatNumber(price, 4)}</strong>
                    </div>
                    <div className="badge-v" style={{ width: '100%' }}>
                      <span>费率</span>
                      <strong>{Number.isFinite(feeRate) ? `${feeRate.toFixed(2)}%` : '—'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>暂无交易记录</div>
            <div className="muted" style={{ marginBottom: 12 }}>
              在基金详情页进行加仓/减仓后，会自动生成记录并按时间倒序展示。
            </div>
            <Link className="button" href={`/fund/${code}`} style={{ display: 'inline-flex', textDecoration: 'none' }}>
              回到基金详情
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
