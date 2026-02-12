import { notFound } from 'next/navigation';
import TradesClient from './tradesClient';

export const metadata = {
  title: '交易记录 - 估值罗盘'
};

export default function FundTradesPage({ params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) notFound();
  return <TradesClient code={code} />;
}

