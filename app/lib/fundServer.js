function isValidFundCode(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}

function stripBom(text) {
  if (typeof text !== 'string') return '';
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function extractBetween(text, left, right) {
  const start = text.indexOf(left);
  if (start < 0) return null;
  const end = text.indexOf(right, start + left.length);
  if (end < 0) return null;
  return text.slice(start + left.length, end);
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function jsLiteralToJsonText(jsLiteral) {
  let t = (jsLiteral ?? '').trim();
  if (!t) return '';
  t = t.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
  t = t.replace(/'/g, '"');
  t = t.replace(/,\s*([}\]])/g, '$1');
  return t;
}

function extractJsVar(source, varName) {
  const re = new RegExp(`\\bvar\\s+${varName}\\s*=\\s*([\\s\\S]*?);`, 'm');
  const m = source.match(re);
  return m ? m[1].trim() : null;
}

async function fetchText(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'user-agent': 'real-time-fund/1.0 (+nextjs)',
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const err = new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  return stripBom(await res.text());
}

async function fetchFundGz(code) {
  const url = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;
  const text = await fetchText(url, { cache: 'no-store' });
  const jsonText = extractBetween(text, 'jsonpgz(', ');');
  const data = jsonText ? safeJsonParse(jsonText) : null;
  if (!data || !data.fundcode) return null;
  return {
    code: data.fundcode,
    name: data.name,
    navDate: data.jzrq,
    navUnit: data.dwjz ? Number(data.dwjz) : null,
    estimateUnit: data.gsz ? Number(data.gsz) : null,
    estimateChangePct: data.gszzl ? Number(data.gszzl) : null,
    estimateTime: data.gztime || null
  };
}

function parsePingZhongSimpleFields(pzSource) {
  const pickString = (name) => {
    const raw = extractJsVar(pzSource, name);
    if (!raw) return null;
    const m = raw.match(/^"([\s\S]*)"$/) || raw.match(/^'([\s\S]*)'$/);
    return m ? m[1] : raw.replace(/^["']|["']$/g, '');
  };

  const pickNumber = (name) => {
    const raw = extractJsVar(pzSource, name);
    if (!raw) return null;
    const n = Number(raw.replace(/;$/, '').trim());
    return Number.isFinite(n) ? n : null;
  };

  return {
    name: pickString('fS_name'),
    code: pickString('fS_code'),
    type: pickString('fS_type'),
    company: pickString('fS_company'),
    manager: pickString('fS_manager'),
    managerImage: pickString('fS_managerImage'),
    foundDate: pickString('fS_foundDate'),
    scale: pickString('fS_scale'),
    benchmark: pickString('fS_benMark'),
    riskLevel: pickString('fS_level') || pickString('fS_riskLevel') || null,
    investmentStyle: pickString('fS_stage') || null,
    trustType: pickString('fS_trustType') || null,
    currentFundManager: pickString('fS_currentFundManager') || null,
    currentFundManagerDescription: pickString('fS_currentFundManagerDescription') || null,
    minBuy: pickNumber('fS_minBuy') || null
  };
}

function parsePingZhongHistory(pzSource) {
  const raw = extractJsVar(pzSource, 'Data_netWorthTrend');
  if (!raw) return [];
  const jsonText = jsLiteralToJsonText(raw);
  const arr = safeJsonParse(jsonText);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p) => {
      const x = typeof p.x === 'number' ? p.x : Number(p.x);
      const y = typeof p.y === 'number' ? p.y : Number(p.y);
      const equityReturn = typeof p.equityReturn === 'number' ? p.equityReturn : Number(p.equityReturn);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      const d = new Date(x);
      // Use China Standard Time (UTC+8) to format the date
      // toISOString() uses UTC, which might shift the date back by 1 day (e.g. 00:00 CST -> 16:00 UTC previous day)
      const date = Number.isFinite(d.getTime())
        ? new Date(x + 8 * 3600 * 1000).toISOString().slice(0, 10)
        : null;
      return {
        date,
        nav: y,
        changePct: Number.isFinite(equityReturn) ? equityReturn : null
      };
    })
    .filter(Boolean);
}

function parsePingZhongAssetAllocation(pzSource) {
  const raw = extractJsVar(pzSource, 'Data_assetAllocation');
  if (!raw) return [];
  const jsonText = jsLiteralToJsonText(raw);
  const data = safeJsonParse(jsonText);
  if (!data) return [];
  if (Array.isArray(data)) {
    return data
      .map((it) => {
        const name = it.x || it.name || it.category;
        const pct = typeof it.y === 'number' ? it.y : Number(it.y ?? it.value);
        if (!name || !Number.isFinite(pct)) return null;
        return { name: String(name), pct };
      })
      .filter(Boolean);
  }
  if (Array.isArray(data.categories) && Array.isArray(data.series) && data.series[0]?.data) {
    return data.categories
      .map((name, idx) => {
        const v = data.series[0].data[idx];
        const pct = typeof v === 'number' ? v : Number(v);
        if (!name || !Number.isFinite(pct)) return null;
        return { name: String(name), pct };
      })
      .filter(Boolean);
  }
  return [];
}

function parseHoldingsFromEastmoney(content) {
  const start = content.indexOf('<tbody>');
  const end = content.indexOf('</tbody>', start);
  if (start < 0 || end < 0) return [];
  const tbody = content.slice(start, end);
  const rowRe = /<tr[\s\S]*?<\/tr>/g;
  const rows = tbody.match(rowRe) || [];
  return rows
    .slice(0, 20)
    .map((row) => {
      const cols = row.match(/<td[\s\S]*?<\/td>/g) || [];
      if (cols.length < 7) return null;
      const stockCode = cols[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const stockName = cols[2]?.replace(/<[^>]+>/g, '').trim() || '';
      const changeText = cols[4] ? cols[4].replace(/<[^>]+>/g, '').trim() : '';
      const ratioText = cols[6] ? cols[6].replace(/<[^>]+>/g, '').trim() : '';
      const changePct = Number(changeText.replace('%', ''));
      const ratio = Number(ratioText.replace('%', ''));
      return {
        name: stockName || null,
        code: stockCode || null,
        ratioPct: Number.isFinite(ratio) ? ratio : null,
        changePct: Number.isFinite(changePct) ? changePct : null
      };
    })
    .filter((x) => x && x.name);
}

function decodeJsStringLiteral(s) {
  if (typeof s !== 'string') return '';
  try {
    return JSON.parse(`"${s.replace(/"/g, '\\"')}"`);
  } catch {
    return s;
  }
}

function extractEastmoneyApiDataContent(text) {
  const t = stripBom(text || '');
  const m =
    t.match(/content:\s*\"([\s\S]*?)\"\s*,\s*arryear\s*:/) ||
    t.match(/content:\s*\"([\s\S]*?)\"\s*,\s*curyear\s*:/) ||
    t.match(/content:\s*\"([\s\S]*?)\"\s*\}\s*;?\s*$/);
  if (!m) return null;
  return decodeJsStringLiteral(m[1]);
}

function getTencentPrefix(code) {
  const c = String(code || '');
  if (c.startsWith('6') || c.startsWith('9')) return 'sh';
  if (c.startsWith('0') || c.startsWith('3')) return 'sz';
  if (c.startsWith('4') || c.startsWith('8')) return 'bj';
  return 'sz';
}

async function fetchTencentStockChangePct(codes) {
  const list = Array.isArray(codes) ? codes.filter((c) => /^\d{6}$/.test(String(c))) : [];
  if (!list.length) return new Map();
  const symbols = list.map((c) => `s_${getTencentPrefix(c)}${c}`).join(',');
  const url = `https://qt.gtimg.cn/q=${symbols}`;
  const text = await fetchText(url, { cache: 'no-store' });
  const map = new Map();
  const re = /v_s_([a-z]{2})(\d{6})="([^"]*)"/g;
  let m;
  while ((m = re.exec(text))) {
    const code = m[2];
    const payload = m[3] || '';
    const parts = payload.split('~');
    const pct = parts.length > 5 ? Number(parts[5]) : NaN;
    if (Number.isFinite(pct)) map.set(code, pct);
  }
  return map;
}

async function fetchTopHoldings(code) {
  const url = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=10&year=&month=&rt=${Date.now()}`;
  const text = await fetchText(url, { cache: 'no-store' });
  const content = extractEastmoneyApiDataContent(text);
  if (!content) return [];
  const holdings = parseHoldingsFromEastmoney(content).slice(0, 10);
  if (!holdings.length) return [];
  try {
    const codes = holdings.map((h) => h.code).filter(Boolean);
    const pctMap = await fetchTencentStockChangePct(codes);
    holdings.forEach((h) => {
      const pct = pctMap.get(h.code);
      if (Number.isFinite(pct)) h.changePct = pct;
    });
  } catch {
  }
  return holdings;
}

async function fetchPingZhongData(code) {
  const url = `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`;
  return fetchText(url, { cache: 'no-store' });
}

function pickFirstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}

export async function getFundDetail(code) {
  if (!isValidFundCode(code)) {
    const err = new Error('Invalid fund code');
    err.status = 400;
    throw err;
  }

  const [gzRes, pzRes, holdingRes] = await Promise.allSettled([
    fetchFundGz(code),
    fetchPingZhongData(code),
    fetchTopHoldings(code)
  ]);

  const gz = gzRes.status === 'fulfilled' ? gzRes.value : null;
  const pzSource = pzRes.status === 'fulfilled' ? pzRes.value : null;
  const holdings = holdingRes.status === 'fulfilled' ? holdingRes.value : [];

  const pz = pzSource ? parsePingZhongSimpleFields(pzSource) : {};
  const history = pzSource ? parsePingZhongHistory(pzSource) : [];
  const assetAllocation = pzSource ? parsePingZhongAssetAllocation(pzSource) : [];

  const name = pickFirstDefined(gz?.name, pz?.name);

  return {
    code,
    name,
    type: pickFirstDefined(pz?.type, null),
    company: pickFirstDefined(pz?.company, null),
    manager: pickFirstDefined(pz?.manager, pz?.currentFundManager, null),
    managerDescription: pickFirstDefined(pz?.currentFundManagerDescription, null),
    managerImage: pickFirstDefined(pz?.managerImage, null),
    foundDate: pickFirstDefined(pz?.foundDate, null),
    scale: pickFirstDefined(pz?.scale, null),
    investmentStyle: pickFirstDefined(pz?.investmentStyle, null),
    riskLevel: pickFirstDefined(pz?.riskLevel, null),
    benchmark: pickFirstDefined(pz?.benchmark, null),
    minBuy: pickFirstDefined(pz?.minBuy, null),
    nav: {
      navDate: gz?.navDate || null,
      navUnit: gz?.navUnit ?? null,
      estimateUnit: gz?.estimateUnit ?? null,
      estimateChangePct: gz?.estimateChangePct ?? null,
      estimateTime: gz?.estimateTime ?? null
    },
    history,
    assetAllocation,
    holdings
  };
}
