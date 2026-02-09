'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

function SettingsIcon(props) {
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

function CloseIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HoldingEditModal({ fund, holding, onClose, onSave }) {
  const [share, setShare] = useState(holding?.share || '');
  const [costAmount, setCostAmount] = useState(() => {
    if (!holding) return '';
    if (typeof holding.costAmount === 'number') return holding.costAmount;
    if (typeof holding.cost === 'number' && typeof holding.share === 'number')
      return holding.cost * holding.share;
    return '';
  });
  const [profitTotal, setProfitTotal] = useState(holding?.profitTotal || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!share || !costAmount || !profitTotal) return;
    const shareNum = Number(share);
    const costAmountNum = Number(costAmount);
    const profitTotalNum = Number(profitTotal);
    const costUnit = shareNum > 0 ? costAmountNum / shareNum : 0;
    onSave({
      share: shareNum,
      costAmount: costAmountNum,
      cost: costUnit,
      profitTotal: profitTotalNum
    });
    onClose();
  };

  const isValid =
    share &&
    costAmount &&
    profitTotal &&
    !isNaN(share) &&
    !isNaN(costAmount) &&
    !isNaN(profitTotal);

  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="编辑持仓"
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
        style={{ maxWidth: '400px' }}
      >
        <div className="title" style={{ marginBottom: 20, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon width="20" height="20" />
            <span>设置持仓</span>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
          >
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="fund-name" style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>
            {fund?.name}
          </div>
          <div className="muted" style={{ fontSize: '12px' }}>
            #{fund?.code}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              持有份额 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              className={`input ${!share ? 'error' : ''}`}
              value={share}
              onChange={(e) => setShare(e.target.value)}
              placeholder="请输入持有份额"
              style={{
                width: '100%',
                border: !share ? '1px solid var(--danger)' : undefined
              }}
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              持仓成本价 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              className={`input ${!costAmount ? 'error' : ''}`}
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="请输入持仓成本价（¥）"
              style={{
                width: '100%',
                border: !costAmount ? '1px solid var(--danger)' : undefined
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="muted" style={{ display: 'block', marginBottom: 8, fontSize: '14px' }}>
              持有收益 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              className={`input ${!profitTotal ? 'error' : ''}`}
              value={profitTotal}
              onChange={(e) => setProfitTotal(e.target.value)}
              placeholder="请输入持有收益（¥）"
              style={{
                width: '100%',
                border: !profitTotal ? '1px solid var(--danger)' : undefined
              }}
            />
          </div>

          <div className="row" style={{ gap: 12 }}>
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
              保存
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

