'use client';

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

export default function HoldingActionModal({ fund, hasHolding, canSell, onClose, onAction }) {
  const sellEnabled = typeof canSell === 'boolean' ? canSell : hasHolding;
  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="持仓操作"
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
        style={{ maxWidth: '320px' }}
      >
        <div className="title" style={{ marginBottom: 20, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingsIcon width="20" height="20" />
            <span>持仓操作</span>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent' }}
          >
            <CloseIcon width="20" height="20" />
          </button>
        </div>

        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div className="fund-name" style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}>
            {fund?.name}
          </div>
          <div className="muted" style={{ fontSize: '12px' }}>
            #{fund?.code}
          </div>
        </div>

        <div className="grid" style={{ gap: 12 }}>
          <button
            className="button col-6"
            onClick={() => onAction('buy')}
            style={{
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)'
            }}
          >
            加仓
          </button>
          <button
            className="button col-6"
            onClick={() => {
              if (!sellEnabled) return;
              onAction('sell');
            }}
            disabled={!sellEnabled}
            style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              opacity: sellEnabled ? 1 : 0.45,
              cursor: sellEnabled ? 'pointer' : 'not-allowed'
            }}
          >
            减仓
          </button>
          <button
            className="button col-12"
            onClick={() => onAction('edit')}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text)'
            }}
          >
            {hasHolding ? '编辑持仓' : '设置持仓'}
          </button>
          {hasHolding ? (
            <button
              className="button col-12"
              onClick={() => onAction('clear')}
              style={{
                marginTop: 8,
                background: 'linear-gradient(180deg, #ef4444, #f87171)',
                border: 'none',
                color: '#2b0b0b',
                fontWeight: 600
              }}
            >
              清空持仓
            </button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
