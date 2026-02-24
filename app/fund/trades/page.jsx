"use client";

import { useSearchParams, notFound } from "next/navigation";
import { Suspense } from "react";
import TradesClient from "./tradesClient";

function TradesContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  if (!code || !/^\d{6}$/.test(code)) {
    return notFound();
  }

  return <TradesClient code={code} />;
}

export default function FundTradesPage() {
  return (
    <Suspense fallback={<div className="ui-page"><div className="ui-glass ui-panel compact"><div className="muted">加载中...</div></div></div>}>
      <TradesContent />
    </Suspense>
  );
}
