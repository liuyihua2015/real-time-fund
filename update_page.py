import os

file_path = 'app/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the start and end markers
start_marker = '<AnimatePresence mode="popLayout">'
end_marker = '</AnimatePresence>'

# Find the specific block inside the main grid div
# We look for the displayFunds.map loop
search_str = '{displayFunds.map((f) => ('

start_index = content.find(search_str)
if start_index == -1:
    print("Could not find start of map block")
    exit(1)

# Find the AnimatePresence wrapping this map
block_start = content.rfind(start_marker, 0, start_index)
if block_start == -1:
    print("Could not find wrapping AnimatePresence")
    exit(1)

# Find the closing AnimatePresence
# It should be the first one after the start_index
block_end = content.find(end_marker, start_index)
if block_end == -1:
    print("Could not find closing AnimatePresence")
    exit(1)

block_end += len(end_marker)

# The content to replace
old_block = content[block_start:block_end]

# The new content
new_block = """<AnimatePresence mode="popLayout">
                    {displayFunds.map((f) => {
                      const { marketValue, holdingReturn, dailyReturn, hasHoldings } = calculateReturns(f);
                      return (
                      <motion.div
                        layout="position"
                        key={f.code}
                        className={viewMode === 'card' ? 'col-6' : 'table-row-wrapper'}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                      <div className={viewMode === 'card' ? 'glass card' : 'table-row'}>
                        {viewMode === 'list' ? (
                          <>
                            <div className="table-cell name-cell">
                              {currentTab !== 'all' && currentTab !== 'fav' ? (
                                <button
                                  className="icon-button fav-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFundFromCurrentGroup(f.code);
                                  }}
                                  title="从当前分组移除"
                                >
                                  <ExitIcon width="18" height="18" style={{ transform: 'rotate(180deg)' }} />
                                </button>
                              ) : (
                                <button
                                  className={}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(f.code);
                                  }}
                                  title={favorites.has(f.code) ? "取消自选" : "添加自选"}
                                >
                                  <StarIcon width="18" height="18" filled={favorites.has(f.code)} />
                                </button>
                              )}
                              <div className="title-text">
                                <span className="name-text">{f.name}</span>
                                <span className="muted code-text">#{f.code}</span>
                              </div>
                            </div>
                            <div className="table-cell text-right value-cell">
                              <span style={{ fontWeight: 700 }}>{f.estPricedCoverage > 0.05 ? f.estGsz.toFixed(4) : (f.gsz ?? '—')}</span>
                            </div>
                            <div className="table-cell text-right change-cell">
                              <span className={f.estPricedCoverage > 0.05 ? (f.estGszzl > 0 ? 'up' : f.estGszzl < 0 ? 'down' : '') : (Number(f.gszzl) > 0 ? 'up' : Number(f.gszzl) < 0 ? 'down' : '')} style={{ fontWeight: 700 }}>
                                {f.estPricedCoverage > 0.05 ?  : (typeof f.gszzl === 'number' ?  : f.gszzl ?? '—')}
                              </span>
                            </div>
                            
                            {/* 新增列：持仓信息 */}
                            <div className="table-cell text-right" style={{ minWidth: '80px' }}>
                              {hasHoldings ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '12px' }}>
                                  <span style={{ fontWeight: 600 }}>{formatCurrency(marketValue)}</span>
                                  <span className={} style={{ fontSize: '10px' }}>
                                    {holdingReturn > 0 ? '+' : ''}{formatCurrency(holdingReturn)}
                                  </span>
                                </div>
                              ) : (
                                <span className="muted">-</span>
                              )}
                            </div>
                            <div className="table-cell text-right" style={{ minWidth: '80px' }}>
                              {hasHoldings ? (
                                <span className={dailyReturn > 0 ? 'up' : dailyReturn < 0 ? 'down' : ''} style={{ fontWeight: 600 }}>
                                  {dailyReturn > 0 ? '+' : ''}{formatCurrency(dailyReturn)}
                                </span>
                              ) : (
                                <span className="muted">-</span>
                              )}
                            </div>

                            <div className="table-cell text-right time-cell">
                              <span className="muted" style={{ fontSize: '12px' }}>{f.gztime || f.time || '-'}</span>
                            </div>
                            <div className="table-cell text-center action-cell" style={{ gap: 4 }}>
                              <button
                                className="icon-button"
                                onClick={() => {
                                  setEditingFund(f);
                                  setEditHoldingOpen(true);
                                }}
                                title="编辑持仓"
                                style={{ width: '28px', height: '28px' }}
                              >
                                <EditIcon width="14" height="14" />
                              </button>
                              <button
                                className="icon-button danger"
                                onClick={() => removeFund(f.code)}
                                title="删除"
                                style={{ width: '28px', height: '28px' }}
                              >
                                <TrashIcon width="14" height="14" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                          <div className="row" style={{ marginBottom: 10 }}>
                            <div className="title">
                              {currentTab !== 'all' && currentTab !== 'fav' ? (
                                <button
                                  className="icon-button fav-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFundFromCurrentGroup(f.code);
                                  }}
                                  title="从当前分组移除"
                                >
                                  <ExitIcon width="18" height="18" style={{ transform: 'rotate(180deg)' }} />
                                </button>
                              ) : (
                                <button
                                  className={}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(f.code);
                                  }}
                                  title={favorites.has(f.code) ? "取消自选" : "添加自选"}
                                >
                                  <StarIcon width="18" height="18" filled={favorites.has(f.code)} />
                                </button>
                              )}
                              <div className="title-text">
                                <span>{f.name}</span>
                                <span className="muted">#{f.code}</span>
                              </div>
                            </div>

                            <div className="actions">
                              <div className="badge-v">
                                <span>估值时间</span>
                                <strong>{f.gztime || f.time || '-'}</strong>
                              </div>
                              <div className="row" style={{ gap: 4 }}>
                                <button
                                  className="icon-button"
                                  onClick={() => {
                                    setEditingFund(f);
                                    setEditHoldingOpen(true);
                                  }}
                                  title="编辑持仓"
                                  style={{ width: '28px', height: '28px' }}
                                >
                                  <EditIcon width="14" height="14" />
                                </button>
                                <button
                                  className="icon-button danger"
                                  onClick={() => removeFund(f.code)}
                                  title="删除"
                                  style={{ width: '28px', height: '28px' }}
                                >
                                  <TrashIcon width="14" height="14" />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="row" style={{ marginBottom: 12 }}>
                            <Stat label="单位净值" value={f.dwjz ?? '—'} />
                            <Stat label="估值净值" value={f.estPricedCoverage > 0.05 ? f.estGsz.toFixed(4) : (f.gsz ?? '—')} />
                            <Stat
                              label="估值涨跌幅"
                              value={f.estPricedCoverage > 0.05 ?  : (typeof f.gszzl === 'number' ?  : f.gszzl ?? '—')}
                              delta={f.estPricedCoverage > 0.05 ? f.estGszzl : (Number(f.gszzl) || 0)}
                            />
                          </div>

                          {/* 持仓信息行 */}
                          {hasHoldings && (
                            <div className="row" style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                              <div className="stat">
                                <span className="label">持仓金额</span>
                                <span className="value">{formatCurrency(marketValue)}</span>
                              </div>
                              <div className="stat">
                                <span className="label">持有收益</span>
                                <span className={}>
                                  {holdingReturn > 0 ? '+' : ''}{formatCurrency(holdingReturn)}
                                </span>
                              </div>
                              <div className="stat">
                                <span className="label">当日收益</span>
                                <span className={}>
                                  {dailyReturn > 0 ? '+' : ''}{formatCurrency(dailyReturn)}
                                </span>
                              </div>
                            </div>
                          )}

                          {f.estPricedCoverage > 0.05 && (
                            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: -8, marginBottom: 10, textAlign: 'right' }}>
                              基于 {Math.round(f.estPricedCoverage * 100)}% 持仓估算
                            </div>
                          )}
                          <div
                            style={{ marginBottom: 8, cursor: 'pointer', userSelect: 'none' }}
                            className="title"
                            onClick={() => toggleCollapse(f.code)}
                          >
                            <div className="row" style={{ width: '100%', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>前10重仓股票</span>
                                <ChevronIcon
                                  width="16"
                                  height="16"
                                  className="muted"
                                  style={{
                                    transform: collapsedCodes.has(f.code) ? 'rotate(-90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease'
                                  }}
                                />
                              </div>
                              <span className="muted">涨跌幅 / 占比</span>
                            </div>
                          </div>
                          <AnimatePresence>
                            {!collapsedCodes.has(f.code) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                style={{ overflow: 'hidden' }}
                              >
                                {Array.isArray(f.holdings) && f.holdings.length ? (
                                  <div className="list">
                                    {f.holdings.map((h, idx) => (
                                      <div className="item" key={idx}>
                                        <span className="name">{h.name}</span>
                                        <div className="values">
                                          {typeof h.change === 'number' && (
                                            <span className={} style={{ marginRight: 8 }}>
                                              {h.change > 0 ? '+' : ''}{h.change.toFixed(2)}%
                                            </span>
                                          )}
                                          <span className="weight">{h.weight}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="muted" style={{ padding: '8px 0' }}>暂无重仓数据</div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                      </div>
                    </motion.div>
                    );
                    })}
                  </AnimatePresence>"""

new_content = content[:block_start] + new_block + content[block_end:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated page.jsx")
