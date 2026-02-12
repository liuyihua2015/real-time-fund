
/**
 * 客户端专用的基金数据获取工具
 * 绕过 Next.js API 路由，直接请求东方财富移动端接口（通常无跨域限制）
 */

export async function getFundDetail(code) {
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid code');

  // 1. 基础信息与估值 (使用移动端接口，通常支持跨域)
  // 或者使用 JSONP 请求之前的接口
  const gzUrl = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;
  
  const fetchGz = () => new Promise((resolve) => {
    const cbName = `jsonpgz_${code}_${Date.now()}`;
    const script = document.createElement('script');
    // 东方财富这个接口固定调用 jsonpgz
    const originalJsonpgz = window.jsonpgz;
    window.jsonpgz = (data) => {
      window.jsonpgz = originalJsonpgz;
      script.remove();
      resolve(data);
    };
    script.src = gzUrl;
    script.onerror = () => {
      window.jsonpgz = originalJsonpgz;
      script.remove();
      resolve(null);
    };
    document.body.appendChild(script);
  });

  // 2. 详情信息 (尝试使用移动端 API)
  const detailUrl = `https://fundmobapi.eastmoney.com/FundMApi/FundVarietieVali.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
  
  // 3. 持仓信息
  const holdingsUrl = `https://fundmobapi.eastmoney.com/FundMApi/FundPositionStockList.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;

  try {
    const [gz, detailRes, holdingsRes] = await Promise.all([
      fetchGz(),
      fetch(detailUrl).then(r => r.json()).catch(() => ({})),
      fetch(holdingsUrl).then(r => r.json()).catch(() => ({}))
    ]);

    const baseInfo = detailRes.Expansion || {};
    const navInfo = detailRes.Datas || {};

    return {
      code,
      name: gz?.name || navInfo.SHORTNAME || code,
      type: navInfo.FTYPE,
      company: baseInfo.JJGS,
      manager: navInfo.MGRNAME,
      managerImage: navInfo.MGRPIC,
      foundDate: baseInfo.ESTABDATE,
      scale: baseInfo.ENDNAV, // 规模
      riskLevel: navInfo.RISKLEVEL,
      nav: {
        navDate: gz?.jzrq || navInfo.FSRQ,
        navUnit: gz?.dwjz || navInfo.DWJZ,
        estimateUnit: gz?.gsz || navInfo.GSZ,
        estimateChangePct: gz?.gszzl || navInfo.GSZZL,
        estimateTime: gz?.gztime || navInfo.GZTIME,
      },
      holdings: (holdingsRes.Datas?.list || []).map(h => ({
        name: h.GPPNAME,
        code: h.GPPCODE,
        ratioPct: h.JZBL,
        changePct: h.NEWPRICE // 这里可能需要实时价格计算，暂时用接口返回的
      })),
      // 历史净值等信息如果需要，可以从详情接口进一步提取
      history: [] 
    };
  } catch (e) {
    console.error('fetch fund detail failed', e);
    throw e;
  }
}
