import { notFound } from "next/navigation";
import { getFundDetail } from "../../lib/fundServer";
import FundCardDetailClient from "./FundCardDetailClient";

// 静态导出需要 generateStaticParams
export async function generateStaticParams() {
  // 预渲染一些热门基金，或者返回空数组
  // GitHub Pages 配合 404.html 插件可以支持动态路由
  return [{ code: "000001" }, { code: "320007" }, { code: "400015" }];
}

export async function generateMetadata({ params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) return { title: "基金详情 - 估值罗盘" };
  try {
    const detail = await getFundDetail(code);
    const title = detail?.name
      ? `${detail.name}（${detail.code}）- 估值罗盘`
      : `${code} - 估值罗盘`;
    const desc = detail?.name
      ? `${detail.name}（${detail.code}）基金详情：估值、净值、持仓与重仓信息。`
      : `${code} 基金详情：估值、净值、持仓与重仓信息。`;
    return {
      title,
      description: desc,
      alternates: { canonical: `/fund/${code}` },
      openGraph: {
        title,
        description: desc,
        type: "website",
        url: `/fund/${code}`,
      },
    };
  } catch {
    return { title: `${code} - 估值罗盘` };
  }
}

export default async function FundDetailPage({ params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) notFound();
  return <FundCardDetailClient code={code} />;
}
