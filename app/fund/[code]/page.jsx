import { notFound } from 'next/navigation';
import { getFundDetail } from '../../lib/fundServer';
import FundCardDetailClient from './FundCardDetailClient';

export async function generateMetadata({ params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) return { title: '基金详情 - 基估宝' };
  try {
    const detail = await getFundDetail(code);
    const title = detail?.name
      ? `${detail.name}（${detail.code}）- 基估宝`
      : `${code} - 基估宝`;
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
        type: 'website',
        url: `/fund/${code}`
      }
    };
  } catch {
    return { title: `${code} - 基估宝` };
  }
}

export default async function FundDetailPage({ params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) notFound();
  return <FundCardDetailClient code={code} />;
}

