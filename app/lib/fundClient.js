
/**
 * 客户端专用的基金数据获取工具
 * 绕过 Next.js API 路由，直接请求东方财富移动端接口（通常无跨域限制）
 */

export async function getFundDetail(code) {
  if (!/^\d{6}$/.test(code)) throw new Error('Invalid code');

  // 1. 基础信息与估值 (使用移动端接口，通常支持跨域)
  const gzUrl = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;
  
  const fetchGz = () => new Promise((resolve) => {
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
  const detailUrl = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNBasicInformation?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=6.0.0`;
  
  // 3. 持仓信息
  const holdingsUrl = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=6.0.0`;

  // 4. 历史净值与更多详情 (使用 PingZhong Data via Script Injection)
  const fetchPingZhong = () => new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`;
    
    script.onload = () => {
      const history = (window.Data_netWorthTrend || []).map(item => {
        // item.x is timestamp
        const date = new Date(item.x);
        // Adjust for timezone if needed, or just use simple formatting
        // Eastmoney timestamps are usually 00:00 local time.
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return {
          date: `${y}-${m}-${d}`,
          nav: item.y,
          changePct: item.equityReturn
        };
      });

      const info = {
        name: window.fS_name,
        type: window.fS_type,
        company: window.fS_company,
        manager: window.fS_manager,
        foundDate: window.fS_foundDate,
        scale: window.fS_scale,
        riskLevel: window.fS_level || window.fS_riskLevel,
      };

      script.remove();
      resolve({ history, info });
    };

    script.onerror = () => {
      script.remove();
      resolve({});
    };

    document.body.appendChild(script);
  });

  try {
    const [gz, detailRes, holdingsRes, pzData] = await Promise.all([
      fetchGz(),
      fetch(detailUrl).then(r => r.json()).catch(() => ({})),
      fetch(holdingsUrl).then(r => r.json()).catch(() => ({})),
      fetchPingZhong()
    ]);

    const navInfo = detailRes.Datas || {};
    const baseInfo = detailRes.Expansion || navInfo;

    // FIX: 兼容新旧接口返回结构
    const holdingsList = Array.isArray(holdingsRes.Datas) 
      ? holdingsRes.Datas 
      : (holdingsRes.Datas?.list || []);

    return {
      code,
      // 优先使用 gz.name，其次 pzData.info.name (pingzhong data usually reliable), 其次接口
      name: gz?.name || pzData.info?.name || navInfo.SHORTNAME || code,
      type: pzData.info?.type || navInfo.FTYPE,
      company: pzData.info?.company || baseInfo.JJGS,
      manager: pzData.info?.manager || navInfo.MGRNAME,
      managerImage: navInfo.MGRPIC,
      foundDate: pzData.info?.foundDate || baseInfo.ESTABDATE,
      scale: pzData.info?.scale || baseInfo.ENDNAV,
      riskLevel: pzData.info?.riskLevel || navInfo.RISKLEVEL,
      nav: {
        navDate: gz?.jzrq || navInfo.FSRQ,
        navUnit: gz?.dwjz || navInfo.DWJZ,
        estimateUnit: gz?.gsz || navInfo.GSZ,
        estimateChangePct: gz?.gszzl || navInfo.GSZZL,
        estimateTime: gz?.gztime || navInfo.GZTIME,
      },
      holdings: holdingsList.map(h => ({
        name: h.GGPNAME || h.GPPNAME,
        code: h.GGPCODE || h.GPPCODE,
        ratioPct: h.JZBL,
        changePct: h.ZDF || h.NEWPRICE 
      })),
      history: pzData.history || []
    };
  } catch (e) {
    console.error('fetch fund detail failed', e);
    throw e;
  }
}
