import styles from './fund-detail.module.css';

function SkeletonLine({ w = '100%', h = 12 }) {
  return (
    <div
      className={styles.skeleton}
      style={{
        width: w,
        height: h
      }}
    />
  );
}

export default function Loading() {
  return (
    <div className={styles.shell}>
      <div className={styles.grain} />

      <div className={`glass ${styles.topbar}`}>
        <div className={styles.brand}>
          <SkeletonLine w="90px" h={14} />
        </div>
        <SkeletonLine w="110px" h={14} />
      </div>

      <div className={styles.container}>
        <div className={styles.heroGrid}>
          <div className={`glass ${styles.heroMain}`}>
            <SkeletonLine w="64%" h={18} />
            <div style={{ marginTop: 10 }}>
              <SkeletonLine w="38%" h={12} />
            </div>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12 }}>
              <div style={{ gridColumn: 'span 4' }}><SkeletonLine w="100%" h={80} /></div>
              <div style={{ gridColumn: 'span 4' }}><SkeletonLine w="100%" h={80} /></div>
              <div style={{ gridColumn: 'span 4' }}><SkeletonLine w="100%" h={80} /></div>
            </div>
          </div>

          <div className={`glass ${styles.heroAside}`}>
            <SkeletonLine w="42%" h={12} />
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <SkeletonLine w="100%" h={56} />
              <SkeletonLine w="100%" h={56} />
              <SkeletonLine w="100%" h={56} />
              <SkeletonLine w="100%" h={56} />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionGrid}>
            <div className={`glass ${styles.chartPanel}`}>
              <div className={styles.chartInner}>
                <SkeletonLine w="120px" h={14} />
                <div style={{ marginTop: 10 }}>
                  <SkeletonLine w="100%" h={260} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionGrid}>
            <div className={`glass ${styles.lowerLeft}`}>
              <SkeletonLine w="140px" h={14} />
              <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                <SkeletonLine w="100%" h={56} />
                <SkeletonLine w="100%" h={56} />
                <SkeletonLine w="100%" h={56} />
              </div>
            </div>
            <div className={`glass ${styles.lowerRight}`}>
              <SkeletonLine w="150px" h={14} />
              <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                <SkeletonLine w="100%" h={44} />
                <SkeletonLine w="100%" h={44} />
                <SkeletonLine w="100%" h={44} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
