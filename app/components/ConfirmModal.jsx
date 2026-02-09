import { motion } from 'framer-motion';

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

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确定删除'
}) {
  return (
    <motion.div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: 10002 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass card modal"
        style={{ maxWidth: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="title" style={{ marginBottom: 12 }}>
          <TrashIcon width="20" height="20" className="danger" />
          <span>{title}</span>
        </div>
        <p className="muted" style={{ marginBottom: 24, fontSize: '14px', lineHeight: '1.6' }}>
          {message}
        </p>
        <div className="row" style={{ gap: 12 }}>
          <button
            className="button secondary"
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text)'
            }}
          >
            取消
          </button>
          <button className="button danger" onClick={onConfirm} style={{ flex: 1 }}>
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

