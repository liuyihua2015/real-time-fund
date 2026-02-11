import { formatYmd, isYmdAfter } from "./dateUtils";

/**
 * 轻量的“交易日”判断：将周一到周五视为交易日，周末视为非交易日。
 * （与 useFunds/useHoldings 里现有行为保持一致）
 */
function isWeekdayTradingDay(now) {
  const day = now.getDay();
  return day !== 0 && day !== 6;
}

/**
 * 将输入规范化为有限数字（否则返回 null）。
 * fundgz 返回的字段经常是字符串，这里统一做稳定的数值处理。
 */
function toFiniteNumber(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * 计算“当前使用的净值”（用于持仓金额/收益计算）。
 *
 * 该函数统一列表页与详情页的判断口径：
 * - 默认使用确权净值（dwjz）
 * - 满足以下条件时切换为估值净值（gsz / estGsz）：
 *   1) navDate 落后于今天（意味着今日确权净值尚未公布），或
 *   2) navDate 缺失 且 在交易日 9:00 之后
 *
 * @param {object} params
 * @param {object} params.fund 列表页风格的基金快照字段：
 *   { dwjz, gsz, jzrq, gszzl, estPricedCoverage?, estGsz? }
 * @param {boolean} [params.isTradingDay] 交易日标记；默认使用“周一到周五”为交易日的启发式判断。
 * @param {Date} [params.now] 当前时间（便于测试/回放）。
 * @param {string} [params.todayStr] 覆盖“今天”的 yyyy-mm-dd 字符串。
 * @returns {{
 *   currentNav: number|null,
 *   useValuation: boolean,
 *   navDate: string|null,
 *   hasTodayData: boolean,
 *   todayStr: string,
 *   tradingDay: boolean,
 * }}
 */
export function calcFundCurrentNav({
  fund,
  isTradingDay,
  now = new Date(),
  todayStr,
} = {}) {
  const navDate = fund?.jzrq;
  const hasNavDate = typeof navDate === "string" && navDate.length >= 10;
  const t =
    typeof todayStr === "string" && todayStr ? todayStr : formatYmd(now);
  const isAfter9 = now.getHours() >= 9;
  const tradingDay =
    typeof isTradingDay === "boolean" ? isTradingDay : isWeekdayTradingDay(now);

  // 若确权净值日期早于今天，则应使用估值数据。
  // 注意：本项目里 isYmdAfter(a, b) 的语义是 “a 是否晚于 b”。
  const hasTodayData = hasNavDate && navDate === t;
  const useValuationByDate = hasNavDate && isYmdAfter(t, navDate);

  // 若缺少 navDate，仅在“交易日 9:00 之后”才启用估值，避免开盘前估值噪声。
  const useValuation =
    useValuationByDate || (!hasNavDate && tradingDay && isAfter9);

  // 数值字段规范化（字符串 -> number）
  const dwjzNum = toFiniteNumber(fund?.dwjz);
  const gszNum = toFiniteNumber(fund?.gsz);
  const estGszNum = toFiniteNumber(fund?.estGsz);

  // 按是否估值模式选择“当前净值”
  let currentNav;
  if (!useValuation) {
    currentNav = dwjzNum;
  } else if (fund?.estPricedCoverage > 0.05 && estGszNum !== null) {
    // 当自估覆盖率足够时，可用 estGsz 覆盖 gsz
    currentNav = estGszNum;
  } else if (gszNum !== null) {
    currentNav = gszNum;
  } else {
    currentNav = dwjzNum;
  }

  return {
    currentNav,
    useValuation,
    navDate: hasNavDate ? navDate : null,
    hasTodayData,
    todayStr: t,
    tradingDay,
  };
}

/**
 * 统一计算持仓指标（持仓金额、当日/昨日/持有收益等），保证列表页与详情页口径一致。
 *
 * 关键点：日收益使用“涨跌幅反推”的方式计算：
 *   profit = amount - amount / (1 + pct/100)
 * 这是列表页历史口径；详情页也应保持一致。
 *
 * @param {object} params
 * @param {object} params.fund 列表页风格的基金快照字段：
 *   { code?, dwjz, gsz, jzrq, gszzl, zzl?, estPricedCoverage?, estGsz?, estGszzl? }
 * @param {object} params.holding 本地持仓记录：
 *   { share, costAmount?, cost?, profitTotal?, startDate? }
 * @param {Array<{date:string, nav:number, changePct:number|null}>} [params.history]
 *   历史净值序列（当 holding.startDate 设置时用于“从开始日重算持有收益”）。
 * @param {boolean} [params.isTradingDay] 交易日标记；默认使用“周一到周五”为交易日的启发式判断。
 * @param {Date} [params.now] 当前时间（便于测试/回放）。
 * @param {string} [params.todayStr] 覆盖“今天”的 yyyy-mm-dd 字符串。
 * @returns {{
 *   share: number,
 *   costAmount: number|null,
 *   costUnit: number|null,
 *   amount: number,
 *   profitToday: number,
 *   profitTotal: number|null,
 *   profitRate: number|null,
 *   profitYesterday: number|null,
 *   currentNav: number,
 *   useValuation: boolean,
 * }|null}
 */
export function calcHoldingProfit({
  fund,
  holding,
  history,
  isTradingDay,
  now = new Date(),
  todayStr,
} = {}) {
  // 必须有合法的份额，才能计算任何指标。
  if (!holding || typeof holding.share !== "number") return null;

  const share = holding.share;

  // 决定当前使用的净值（确权 vs 估值）。
  const base = calcFundCurrentNav({ fund, isTradingDay, now, todayStr });
  const currentNav = base?.currentNav;
  if (!Number.isFinite(currentNav)) return null;

  // 优先使用 costAmount；否则用 cost(成本单价) * 份额推导。
  const costAmount =
    typeof holding.costAmount === "number"
      ? holding.costAmount
      : typeof holding.cost === "number"
        ? holding.cost * share
        : null;

  // 能从 costAmount 推导成本单价时优先推导，否则使用 holding.cost。
  const costUnit =
    typeof holding.costAmount === "number"
      ? share > 0
        ? holding.costAmount / share
        : 0
      : typeof holding.cost === "number"
        ? holding.cost
        : null;

  // 当前持仓金额
  const amount = share * currentNav;

  // 当日收益：使用“涨跌幅反推”以匹配列表页口径。
  let profitToday;
  if (!base.useValuation) {
    if (base.hasTodayData) {
      // 优先使用真实涨跌幅 zzl（若存在），否则降级为 gszzl。
      const rate =
        fund?.zzl !== undefined ? Number(fund.zzl) : Number(fund?.gszzl) || 0;
      const denom = 1 + rate / 100;
      profitToday = denom ? amount - amount / denom : 0;
    } else {
      // 今日确权净值未出，且不在估值模式时：列表页口径为当日收益 = 0。
      profitToday = 0;
    }
  } else {
    // 估值模式下：使用估值涨跌幅（estGszzl / gszzl）。
    const estGszzlNum = toFiniteNumber(fund?.estGszzl);
    const gzChange =
      fund?.estPricedCoverage > 0.05 && estGszzlNum !== null
        ? estGszzlNum
        : Number(fund?.gszzl) || 0;
    const denom = 1 + gzChange / 100;
    profitToday = denom ? amount - amount / denom : 0;
  }

  // 持有收益：
  // - 若设置了 startDate 且存在历史数据：用“开始日前一日净值”作为基准重算浮动收益，
  //   然后叠加已实现收益（holding.profitTotal）。
  // - 否则退化为：按成本单价 costUnit 计算浮动收益 + 已实现收益。
  let profitTotal = null;
  const hist = Array.isArray(history) ? history : null;

  if (holding.startDate && hist) {
    // 找到第一条 date >= startDate 的记录，并取其前一日净值作为 baseNav。
    const startIndex = hist.findIndex((h) => h?.date >= holding.startDate);
    const baseNav =
      startIndex > 0 ? toFiniteNumber(hist[startIndex - 1]?.nav) : null;

    if (baseNav !== null) {
      const floatingProfit = share * (currentNav - baseNav);
      const realizedProfit =
        typeof holding.profitTotal === "number" ? holding.profitTotal : 0;
      profitTotal = floatingProfit + realizedProfit;
    }
  }

  if (profitTotal === null) {
    if (typeof costUnit === "number") {
      const floatingProfit = (currentNav - costUnit) * share;
      const realizedProfit =
        typeof holding.profitTotal === "number" ? holding.profitTotal : 0;
      profitTotal = floatingProfit + realizedProfit;
    } else if (typeof holding.profitTotal === "number") {
      profitTotal = holding.profitTotal;
    }
  }

  // 持有收益率：基于成本金额计算
  const profitRate =
    costAmount && profitTotal !== null
      ? (profitTotal / costAmount) * 100
      : null;

  // 昨日收益：与列表页策略一致
  // - 若今日确权净值未出：把“昨日收益”视为“最近一个确权日”的日收益（用涨跌幅反推）
  // - 若今日确权净值已出：尝试用历史倒数第二天的 changePct 反推，避免历史缺失时误报
  let profitYesterday = null;
  const confirmedNav = toFiniteNumber(fund?.dwjz);
  if (confirmedNav !== null) {
    // 【修正逻辑】昨日收益对应的涨跌幅仅能使用确权涨跌幅 zzl。
    // 不能降级使用 gszzl，因为在交易时间内 gszzl 是今日估值，会导致昨日收益等于今日收益。
    const confirmedChangePct =
      fund?.zzl !== undefined ? Number(fund.zzl) : null;

    const confirmedAmount = share * confirmedNav;

    if (!base.hasTodayData) {
      if (confirmedChangePct !== null) {
        const denom = 1 + confirmedChangePct / 100;
        profitYesterday = denom ? confirmedAmount - confirmedAmount / denom : 0;
      } else if (hist && hist.length >= 1) {
        // 如果 zzl 缺失，尝试从历史记录的第一条（最新的确权记录）获取涨跌幅
        const latest = hist[hist.length - 1];
        const latestChangePct = toFiniteNumber(latest?.changePct);
        if (latestChangePct !== null) {
          const denom = 1 + latestChangePct / 100;
          profitYesterday = denom
            ? confirmedAmount - confirmedAmount / denom
            : 0;
        }
      }
    } else if (hist && hist.length >= 2) {
      const y = hist[hist.length - 2];
      const yNav = toFiniteNumber(y?.nav);
      const yChangePct = toFiniteNumber(y?.changePct);
      if (yNav !== null && yChangePct !== null) {
        const yAmount = share * yNav;
        const yDenom = 1 + yChangePct / 100;
        profitYesterday = yDenom ? yAmount - yAmount / yDenom : 0;
      }
    }
  }

  return {
    share,
    costAmount,
    costUnit,
    amount,
    profitToday,
    profitTotal,
    profitRate,
    profitYesterday,
    currentNav,
    useValuation: base.useValuation,
  };
}
