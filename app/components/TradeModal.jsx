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

export default function TradeModal({ type, fund, unitPrice, maxSellShare, onClose, onConfirm }) {
  const isBuy = type === 'buy';
  const [mode, setMode] = useState(isBuy ? 'amount' : 'share'); // 'amount' | 'share'
  const [share, setShare] = useState('');
  const [amount, setAmount] = useState('');
  const [feeRate, setFeeRate] = useState('0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [price, setPrice] = useState(String(unitPrice || ''));
  const holdingShare =
    typeof maxSellShare === 'number' && Number.isFinite(maxSellShare) ? maxSellShare : null;
  
  // OCR states
  const fileInputRef = useRef(null);
  const [ocrStatus, setOcrStatus] = useState('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [ocrFields, setOcrFields] = useState(null);
  const [ocrShowText, setOcrShowText] = useState(false);

  // Auto-calculate logic
  const preview = (() => {
    const p = parseFloat(price);
    const r = parseFloat(feeRate) / 100;
    if (!p || p <= 0 || isNaN(r)) return null;

    if (mode === 'amount') {
      const a = parseFloat(amount);
      if (!a || a <= 0) return null;
      if (isBuy) {
        // Buy by Amount: Net = Amount / (1+r), Share = Net / Price
        const netAmount = a / (1 + r);
        const fee = a - netAmount;
        const estShare = netAmount / p;
        return { share: estShare, fee, netAmount };
      } else {
        // Sell by Amount: Target Net Amount = Amount
        // Gross = Amount / (1-r), Share = Gross / Price
        // Note: r is usually deducted from Gross. Gross - Gross*r = Net => Gross(1-r) = Net
        if (r >= 1) return null;
        const grossAmount = a / (1 - r);
        const fee = grossAmount - a;
        const estShare = grossAmount / p;
        return { share: estShare, fee, grossAmount };
      }
    } else {
      const s = parseFloat(share);
      if (!s || s <= 0) return null;
      if (isBuy) {
        // Buy by Share: Net = Share * Price, Gross = Net * (1+r)
        const netAmount = s * p;
        const grossAmount = netAmount * (1 + r);
        const fee = grossAmount - netAmount;
        return { amount: grossAmount, fee, netAmount };
      } else {
        // Sell by Share: Gross = Share * Price, Net = Gross * (1-r)
        const grossAmount = s * p;
        const fee = grossAmount * r;
        const netAmount = grossAmount - fee;
        return { amount: netAmount, fee, grossAmount };
      }
    }
  })();

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
    
    // Auto-detect mode based on what's available
    if (fields.amount && fields.share) {
        // If both, prefer Share for sell, Amount for buy? Or just fill both if possible?
        // Actually we only input one. Let's infer.
        setAmount(String(fields.amount));
        // We can't set share directly if mode is amount, but we can switch mode?
        // Let's stick to current mode or switch if current input is empty.
        if (!amount && mode === 'amount') setAmount(String(fields.amount));
        else if (!share && mode === 'share') setShare(String(fields.share));
    } else if (fields.amount) {
        setMode('amount');
        setAmount(String(fields.amount));
    } else if (fields.share) {
        setMode('share');
        setShare(String(fields.share));
    }
  };

  const sellError = (() => {
    if (isBuy) return '';
    if (holdingShare == null) return '';
    if (!(holdingShare > 0)) return '当前没有可卖出的持仓份额';
    if (!preview) return '';
    const eps = 1e-6;
    if (mode === 'share') {
      const s = parseFloat(share);
      if (s > holdingShare + eps) return `卖出份额不能大于持仓份额（最多 ${holdingShare.toFixed(2)} 份）`;
      return '';
    }
    if (mode === 'amount') {
      if (preview.share > holdingShare + eps) {
        const p = parseFloat(price);
        const r = parseFloat(feeRate) / 100;
        const maxNetAmount =
          Number.isFinite(p) && Number.isFinite(r) && r < 1 ? holdingShare * p * (1 - r) : null;
        return typeof maxNetAmount === 'number' && Number.isFinite(maxNetAmount)
          ? `卖出金额过大（最多到手 ¥${maxNetAmount.toFixed(2)}）`
          : '卖出金额过大（超过持仓可卖范围）';
      }
      return '';
    }
    return '';
  })();

  const isValid = !!preview && !sellError;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    const payload = {
        type,
        date,
        price: parseFloat(price),
        feeRate: parseFloat(feeRate),
        // Standardized output: always provide total involved amount and final share change
        mode,
        inputAmount: mode === 'amount' ? parseFloat(amount) : null,
        inputShare: mode === 'share' ? parseFloat(share) : null,
    };

    // Enrich payload with calculated values
    if (isBuy) {
        if (mode === 'amount') {
            payload.totalCost = parseFloat(amount); // Gross input
            payload.share = preview.share;
        } else {
            payload.totalCost = preview.amount; // Calculated Gross
            payload.share = parseFloat(share);
        }
    } else {
        if (mode === 'amount') {
            payload.redemptionAmount = parseFloat(amount); // Net target
            payload.share = preview.share;
        } else {
            payload.redemptionAmount = preview.amount; // Calculated Net
            payload.share = parseFloat(share);
        }
    }

    onConfirm(payload);
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

        {/* OCR Section */}
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
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Mode Switcher */}
          <div style={{ 
            padding: 4, 
            borderRadius: 10, 
            marginBottom: 20, 
            display: 'flex',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <button
              type="button"
              onClick={() => setMode('amount')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: mode === 'amount' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: mode === 'amount' ? 'var(--text)' : 'var(--muted)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {isBuy ? '按金额买入' : '按金额卖出'}
            </button>
            <button
              type="button"
              onClick={() => setMode('share')}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: mode === 'share' ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: mode === 'share' ? 'var(--text)' : 'var(--muted)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {isBuy ? '按份额买入' : '按份额卖出'}
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
              {mode === 'amount' ? (isBuy ? '买入金额 (¥)' : '目标到手金额 (¥)') : (isBuy ? '确认份额' : '卖出份额')} <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              className="input"
              value={mode === 'amount' ? amount : share}
              onChange={(e) => mode === 'amount' ? setAmount(e.target.value) : setShare(e.target.value)}
              placeholder={mode === 'amount' ? "0.00" : "0.00"}
              max={
                !isBuy && holdingShare != null && holdingShare > 0
                  ? mode === 'share'
                    ? holdingShare
                    : (() => {
                        const p = parseFloat(price);
                        const r = parseFloat(feeRate) / 100;
                        if (!Number.isFinite(p) || !Number.isFinite(r) || r >= 1) return undefined;
                        return holdingShare * p * (1 - r);
                      })()
                  : undefined
              }
              style={{
                width: '100%',
                border:
                  ((!amount && mode === 'amount') || (!share && mode === 'share') || sellError)
                    ? '1px solid var(--danger)'
                    : undefined
              }}
            />
            {!isBuy && holdingShare != null ? (
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                可卖份额：{holdingShare > 0 ? `${holdingShare.toFixed(2)} 份` : '0 份'}
              </div>
            ) : null}
            {sellError ? (
              <div className="error-text" style={{ marginTop: 8 }}>
                {sellError}
              </div>
            ) : null}
          </div>

          <div className="row" style={{ gap: 10, marginBottom: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                确认净值
              </label>
              <input
                type="number"
                step="any"
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="自动获取"
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
                费率 (%)
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
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>
              交易日期
            </label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Preview Section */}
          {preview ? (
            <div
              className="glass"
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'rgba(34, 211, 238, 0.05)',
                border: '1px solid rgba(34, 211, 238, 0.2)',
                marginBottom: 16
              }}
            >
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="muted" style={{ fontSize: 12 }}>
                  {mode === 'amount' ? '预估确认份额' : (isBuy ? '预估总投入' : '预估到手金额')}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {mode === 'amount' 
                    ? `${preview.share.toFixed(2)} 份` 
                    : `¥${preview.amount.toFixed(2)}`
                  }
                </span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted" style={{ fontSize: 12 }}>预估手续费</span>
                <span className="muted" style={{ fontSize: 12 }}>¥{preview.fee.toFixed(2)}</span>
              </div>
            </div>
          ) : null}

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
