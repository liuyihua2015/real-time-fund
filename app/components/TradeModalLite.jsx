'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { recognizeImage } from '../lib/ocrClient';

function parseOcrNumber(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[,\s]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function pad2(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

function normalizeOcrDate(text) {
  if (!text) return null;
  const m = String(text).match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${y}-${pad2(mm)}-${pad2(dd)}`;
}

function extractTradeFieldsFromOcr(text) {
  const t = String(text || '')
    .replace(/，/g, ',')
    .replace(/：/g, ':')
    .replace(/[￥¥]/g, '¥')
    .replace(/\s+/g, ' ')
    .trim();

  const pickByLabel = (label) => {
    const re = new RegExp(`${label}[^0-9]{0,10}([0-9][0-9,]*\\.?[0-9]*)`);
    const m = t.match(re);
    return m ? parseOcrNumber(m[1]) : null;
  };

  const amount =
    pickByLabel('成交金额') ??
    pickByLabel('实付') ??
    pickByLabel('付款') ??
    pickByLabel('买入金额') ??
    pickByLabel('金额');
  const share = pickByLabel('份额') ?? pickByLabel('份') ?? pickByLabel('数量');
  const date = normalizeOcrDate(t);

  const nums = Array.from(t.matchAll(/([0-9][0-9,]*\.?[0-9]*)/g))
    .map((m) => parseOcrNumber(m[1]))
    .filter((n) => typeof n === 'number' && Number.isFinite(n));
  const maxNum = nums.length ? Math.max(...nums) : null;

  return {
    amount: typeof amount === 'number' && amount > 0 ? amount : null,
    share: typeof share === 'number' && share > 0 ? share : null,
    date,
    fallbackMax: typeof maxNum === 'number' && maxNum > 0 ? maxNum : null
  };
}

export default function TradeModalLite({ type, fund, unitPrice, onClose, onConfirm }) {
  const isBuy = type === 'buy';
  const [share, setShare] = useState('');
  const [amount, setAmount] = useState('');
  const [feeRate, setFeeRate] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [calcShare, setCalcShare] = useState(null);

  const fileInputRef = useRef(null);
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrFields, setOcrFields] = useState(null);
  const [ocrShowText, setOcrShowText] = useState(false);

  useEffect(() => {
    if (!isBuy) return;
    const a = parseFloat(amount);
    const f = parseFloat(feeRate);
    const p = Number(unitPrice);
    if (a > 0 && p > 0 && !isNaN(f)) {
      const netAmount = a / (1 + f / 100);
      const s = netAmount / p;
      setCalcShare(s);
    } else {
      setCalcShare(null);
    }
  }, [isBuy, amount, feeRate, unitPrice]);

  const handlePickImage = async (file) => {
    if (!file) return;
    setOcrError('');
    setOcrText('');
    setOcrFields(null);
    setOcrShowText(false);
    setOcrStatus('loading');
    setOcrProgress(0);
    try {
      const text = await recognizeImage(file, {
        lang: 'chi_sim+eng',
        onProgress: (m) => {
          if (m?.status) setOcrStatus(String(m.status));
          if (typeof m?.progress === 'number') setOcrProgress(m.progress);
        }
      });
      setOcrText(text);
      setOcrFields(extractTradeFieldsFromOcr(text));
      setOcrStatus('done');
    } catch (e) {
      setOcrStatus('error');
      setOcrError(e?.message ? String(e.message) : '识别失败');
    }
  };

  const applyOcrToForm = () => {
    const fields = ocrFields;
    if (!fields) return;
    if (fields.date) setDate(fields.date);
    if (isBuy) {
      const nextAmount =
        fields.amount ?? (fields.fallbackMax && fields.fallbackMax >= 10 ? fields.fallbackMax : null);
      if (nextAmount != null) setAmount(String(nextAmount));
    } else {
      const nextShare =
        fields.share ?? (fields.fallbackMax && fields.fallbackMax < 1000000 ? fields.fallbackMax : null);
      if (nextShare != null) setShare(String(nextShare));
    }
  };

  const isValid = isBuy
    ? !!amount && !!feeRate && !!date && calcShare !== null && Number.isFinite(Number(unitPrice))
    : !!share;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    if (isBuy) {
      onConfirm({
        type: 'buy',
        totalCost: Number(amount),
        share: Number(calcShare),
        date
      });
    } else {
      onConfirm({
        type: 'sell',
        share: Number(share),
        date
      });
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={isBuy ? '加仓' : '减仓'}
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <div className="title" style={{ marginBottom: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{isBuy ? '📥' : '📤'}</span>
            <span>{isBuy ? '加仓' : '减仓'}</span>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="fund-name" style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {fund?.name}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            #{fund?.code}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="button secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text)',
                padding: '10px 12px'
              }}
              disabled={ocrStatus === 'loading' || ocrStatus === 'recognizing text'}
            >
              从图片识别
            </button>
            <div className="muted" style={{ fontSize: 12, flex: 1 }}>
              {ocrStatus === 'idle'
                ? '支持截图/交易回单'
                : ocrStatus === 'done'
                  ? '识别完成'
                  : ocrStatus === 'error'
                    ? '识别失败'
                    : `${ocrStatus} ${Math.round((ocrProgress || 0) * 100)}%`}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e?.target?.files?.[0];
              e.target.value = '';
              handlePickImage(file);
            }}
          />

          {ocrError ? (
            <div className="error-text" style={{ marginTop: 10 }}>
              {ocrError}
            </div>
          ) : null}

          {ocrFields && (ocrFields.amount || ocrFields.share || ocrFields.date) ? (
            <div
              className="glass"
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.03)'
              }}
            >
              <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                <div className="muted" style={{ fontSize: 12, flex: 1 }}>
                  {ocrFields.date ? `日期 ${ocrFields.date}` : null}
                  {ocrFields.amount ? `  金额 ¥${ocrFields.amount}` : null}
                  {ocrFields.share ? `  份额 ${ocrFields.share}` : null}
                </div>
                <button
                  type="button"
                  className="button"
                  onClick={applyOcrToForm}
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(34, 211, 238, 0.12)',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                    color: 'var(--primary)'
                  }}
                >
                  填入表单
                </button>
              </div>
              {ocrText ? (
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setOcrShowText((v) => !v)}
                    style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {ocrShowText ? '收起识别文本' : '展开识别文本'}
                  </button>
                  {ocrShowText ? (
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        marginTop: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                        opacity: 0.9
                      }}
                    >
                      {ocrText}
                    </pre>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit}>
          {isBuy ? (
            <>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                  加仓金额 (¥) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="请输入加仓金额"
                  style={{
                    width: '100%',
                    border: !amount ? '1px solid var(--danger)' : undefined
                  }}
                />
              </div>
              <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                    买入费率 (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    value={feeRate}
                    onChange={(e) => setFeeRate(e.target.value)}
                    placeholder="0"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                    日期
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              {Number.isFinite(Number(unitPrice)) && calcShare !== null ? (
                <div
                  className="glass"
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background: 'rgba(34, 211, 238, 0.05)',
                    border: '1px solid rgba(34, 211, 238, 0.2)',
                    marginBottom: 10
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="muted" style={{ fontSize: 12 }}>
                      预计确认份额
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {calcShare.toFixed(2)} 份
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    估算基于当前单位净值：{Number(unitPrice).toFixed(4)}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                  卖出份额 <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={share}
                  onChange={(e) => setShare(e.target.value)}
                  placeholder="请输入卖出份额"
                  style={{
                    width: '100%',
                    border: !share ? '1px solid var(--danger)' : undefined
                  }}
                />
              </div>
            </>
          )}

          <div className="row" style={{ gap: 12, marginTop: 12 }}>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text)'
              }}
            >
              取消
            </button>
            <button type="submit" className="button" disabled={!isValid} style={{ flex: 1, opacity: isValid ? 1 : 0.6 }}>
              确定
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
