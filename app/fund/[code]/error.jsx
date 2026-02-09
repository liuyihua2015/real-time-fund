'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './fund-detail.module.css';

export default function Error({ error, reset }) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <div className={styles.shell}>
      <div className={styles.grain} />

      <div className={`glass ${styles.topbar}`}>
        <div className={styles.crumbs}>
          <Link className={styles.crumbLink} href="/">基金列表</Link>
          <span style={{ opacity: 0.55 }}>/</span>
          <span>详情</span>
        </div>
        <Link className={styles.backBtn} href="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回
        </Link>
      </div>

      <div className={styles.container}>
        <div className={`glass ${styles.heroMain}`} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, color: 'rgba(229,231,235,0.75)', letterSpacing: 0.18 }}>加载失败</div>
          <div style={{ marginTop: 10, fontSize: 20, fontWeight: 850 }}>暂时无法获取基金详情数据</div>
          <div style={{ marginTop: 10, color: 'rgba(229,231,235,0.78)', fontSize: 13, lineHeight: 1.55 }}>
            可能是网络波动、数据源限流或基金代码不存在。你可以重试，或返回列表继续浏览。
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              className="button"
              style={{ padding: '10px 14px', borderRadius: 12 }}
            >
              重试
            </button>
            <Link
              href="/"
              className="button"
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              返回列表
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

