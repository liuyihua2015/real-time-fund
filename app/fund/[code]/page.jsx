import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Noto_Sans_SC, Noto_Serif_SC, IBM_Plex_Mono } from 'next/font/google';
import FundChart from './FundChart';
import styles from './fund-detail.module.css';
import { getFundDetail } from '../../lib/fundServer';

const fontSans = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap'
});

const fontSerif = Noto_Serif_SC({
  subsets: ['latin'],
  weight: ['600', '700', '900'],
  display: 'swap'
});

const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap'
});

function formatPct(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function formatNumber(n, digits = 4) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function formatMoney(n) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(2);
}

function pickChangeClass(pct) {
  if (!Number.isFinite(pct)) return '';
  if (pct > 0) return styles.up;
  if (pct < 0) return styles.down;
  return '';
}

function buildLdJson(detail) {
  const descriptionParts = [];
  if (detail.type) descriptionParts.push(detail.type);
  if (detail.manager) descriptionParts.push(`基金经理：${detail.manager}`);
  if (Number.isFinite(detail.nav?.navUnit)) descriptionParts.push(`净值：${detail.nav.navUnit}`);
  if (Number.isFinite(detail.nav?.estimateChangePct)) descriptionParts.push(`估算涨跌：${detail.nav.estimateChangePct}%`);

  return {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: detail.name ? `${detail.name}（${detail.code}）` : detail.code,
    category: detail.type || 'Fund',
    identifier: detail.code,
    description: descriptionParts.join(' · ') || '基金详情'
  };
}

export async function generateMetadata({ params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) return { title: '基金详情 - 基估宝' };
  try {
    const detail = await getFundDetail(code);
    const title = detail?.name ? `${detail.name}（${detail.code}）基金详情 - 基估宝` : `${code} 基金详情 - 基估宝`;
    const desc = detail?.name
      ? `${detail.name}（${detail.code}）基金详情：净值、涨跌、经理、规模、资产配置与重仓信息。`
      : `${code} 基金详情：净值、涨跌、经理、规模、资产配置与重仓信息。`;
    return {
      title,
      description: desc,
      alternates: { canonical: `/fund/${code}` },
      openGraph: {
        title,
        description: desc,
        type: 'website',
        url: `/fund/${code}`
      }
    };
  } catch {
    return { title: `${code} 基金详情 - 基估宝` };
  }
}

export default async function FundDetailPage({ params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) notFound();

  let detail;
  try {
    detail = await getFundDetail(code);
  } catch {
    notFound();
  }

  const name = detail?.name || code;
  const navUnit = detail?.nav?.navUnit;
  const navDate = detail?.nav?.navDate;
  const estUnit = detail?.nav?.estimateUnit;
  const estChangePct = detail?.nav?.estimateChangePct;
  const estTime = detail?.nav?.estimateTime;

  const currentUnit = Number.isFinite(estUnit) ? estUnit : navUnit;
  const currentChangePct = Number.isFinite(estChangePct) ? estChangePct : null;

  const asset = Array.isArray(detail.assetAllocation) ? detail.assetAllocation : [];
  const holdings = Array.isArray(detail.holdings) ? detail.holdings : [];
  const ldjson = buildLdJson(detail);

  return (
    <div className={`${styles.shell} ${fontSans.className}`} style={{ ['--font-mono']: fontMono.style.fontFamily }}>
      <div className={styles.grain} />

      <div className={`glass ${styles.topbar}`}>
        <div className={styles.crumbs}>
          <Link className={styles.crumbLink} href="/">基金列表</Link>
          <span style={{ opacity: 0.55 }}>/</span>
          <span>{name}</span>
        </div>
        <Link className={styles.backBtn} href="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          返回
        </Link>
      </div>

      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div className={`glass ${styles.heroMain}`}>
            <div className={styles.kicker}>
              <span className={styles.pill} style={{ fontFamily: 'var(--font-mono)' }}>#{detail.code}</span>
              <span className={styles.pill}>{detail.type || '基金'}</span>
              {detail.company ? <span className={styles.pill}>{detail.company}</span> : null}
            </div>

            <div className={`${styles.title} ${fontSerif.className}`}>{name}</div>

            <div className={styles.subline}>
              <span>净值日期：{navDate || '—'}</span>
              <span>估值时间：{estTime || '—'}</span>
              {detail.benchmark ? <span>业绩比较基准：{detail.benchmark}</span> : null}
            </div>

            <div className={styles.metricsRow}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  当前净值
                </div>
                <div className={styles.metricValue} style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatNumber(currentUnit)}
                </div>
                <div className={styles.metricHint}>
                  {Number.isFinite(estUnit) ? '使用估值（盘中）' : '使用已确认净值'}
                </div>
              </div>

              <div className={styles.metric}>
                <div className={styles.metricLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 15l4-4 3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 8v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  日涨跌幅（估算）
                </div>
                <div className={`${styles.metricValue} ${pickChangeClass(currentChangePct)}`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatPct(currentChangePct)}
                </div>
                <div className={styles.metricHint}>
                  {Number.isFinite(estChangePct) ? '估值涨跌（供参考）' : '暂无可用涨跌幅'}
                </div>
              </div>

              <div className={styles.metric}>
                <div className={styles.metricLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  最近日收益（估算）
                </div>
                <div className={styles.metricValue} style={{ fontFamily: 'var(--font-mono)' }}>
                  {Number.isFinite(navUnit) && Number.isFinite(estUnit) ? formatMoney((estUnit - navUnit) * 1) : '—'}
                </div>
                <div className={styles.metricHint}>
                  单位净值差值（未按持仓份额换算）
                </div>
              </div>
            </div>
          </div>

          <div className={`glass ${styles.heroAside}`}>
            <div className={styles.asideTitle}>关键属性</div>

            <div className={styles.kv}>
              <div className={styles.kvItem}>
                <div className={styles.kvK}>基金经理</div>
                <div className={styles.kvV}>{detail.manager || '—'}</div>
              </div>
              <div className={styles.kvItem}>
                <div className={styles.kvK}>成立时间</div>
                <div className={styles.kvV}>{detail.foundDate || '—'}</div>
              </div>
              <div className={styles.kvItem}>
                <div className={styles.kvK}>基金规模</div>
                <div className={styles.kvV}>{detail.scale || '—'}</div>
              </div>
              <div className={styles.kvItem}>
                <div className={styles.kvK}>风险等级</div>
                <div className={styles.kvV}>{detail.riskLevel || '—'}</div>
              </div>
              <div className={styles.kvItem}>
                <div className={styles.kvK}>投资风格</div>
                <div className={styles.kvV}>{detail.investmentStyle || '—'}</div>
              </div>
              <div className={styles.kvItem}>
                <div className={styles.kvK}>起购金额</div>
                <div className={styles.kvV}>{Number.isFinite(detail.minBuy) ? `¥${formatMoney(detail.minBuy)}` : '—'}</div>
              </div>
            </div>

            <div className={styles.riskBox}>
              风险提示：历史表现不预示未来收益；净值估算可能与最终确认值存在偏差，请以基金公司公告为准。
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionGrid}>
            <div className={`glass ${styles.chartPanel}`}>
              <div className={styles.chartInner}>
                <FundChart history={detail.history} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionGrid}>
            <div className={`glass ${styles.lowerLeft}`}>
              <div className={styles.sectionTitleRow}>
                <div className={styles.sectionTitle}>基金经理与说明</div>
                <div className={styles.sectionNote}>信息来自公开数据源</div>
              </div>

              <div className={styles.twoCol} style={{ alignItems: 'start' }}>
                <div className={styles.textBlock}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>{detail.manager || '—'}</div>
                  <div style={{ color: 'rgba(229,231,235,0.72)', fontSize: 12, marginBottom: 10 }}>
                    {detail.company || '—'}
                  </div>
                  <div>{detail.managerDescription || '暂无经理简介信息。'}</div>
                </div>

                <div>
                  {detail.managerImage ? (
                    <img
                      src={detail.managerImage}
                      alt={detail.manager ? `${detail.manager} 照片` : '基金经理照片'}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        maxWidth: 260,
                        aspectRatio: '4 / 5',
                        objectFit: 'cover',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(0,0,0,0.18)'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 260,
                        aspectRatio: '4 / 5',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(0,0,0,0.14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(229,231,235,0.55)',
                        fontSize: 12
                      }}
                    >
                      暂无图片
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`glass ${styles.lowerRight}`}>
              <div className={styles.sectionTitleRow}>
                <div className={styles.sectionTitle}>资产配置与重仓</div>
                <div className={styles.sectionNote}>按可用数据展示</div>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'rgba(229,231,235,0.72)', letterSpacing: 0.2 }}>资产配置</div>
                {asset.length ? (
                  <div className={styles.allocBars}>
                    {asset.slice(0, 6).map((a) => (
                      <div key={a.name} className={styles.allocRow}>
                        <div className={styles.allocName}>{a.name}</div>
                        <div className={styles.allocTrack}>
                          <div className={styles.allocFill} style={{ width: `${Math.max(0, Math.min(100, a.pct))}%` }} />
                        </div>
                        <div className={styles.allocPct}>{a.pct.toFixed(2)}%</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.textBlock} style={{ marginTop: 8, color: 'rgba(229,231,235,0.70)' }}>
                    暂无资产配比数据。
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: 'rgba(229,231,235,0.72)', letterSpacing: 0.2 }}>前 10 重仓（如可用）</div>
                {holdings.length ? (
                  <ul className={styles.list}>
                    {holdings.slice(0, 10).map((h) => (
                      <li key={`${h.code || h.name}`} className={styles.listItem}>
                        <div className={styles.itemMain}>
                          <div className={styles.itemTitle}>{h.name}</div>
                          <div className={styles.itemSub}>{h.code || '—'}</div>
                        </div>
                        <div className={styles.itemRight}>
                          {Number.isFinite(h.ratioPct) ? `${h.ratioPct.toFixed(2)}%` : '—'}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.textBlock} style={{ marginTop: 8, color: 'rgba(229,231,235,0.70)' }}>
                    暂无重仓数据。
                  </div>
                )}

                <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a
                    href={`https://fundf10.eastmoney.com/jjcc_${detail.code}.html`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.backBtn}
                    style={{ padding: '8px 10px' }}
                  >
                    查看完整持仓
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M10 7h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldjson) }}
      />
    </div>
  );
}

