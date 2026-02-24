"use client";

import { useSearchParams, notFound } from "next/navigation";
import { Suspense } from "react";
import FundCardDetailClient from "./FundCardDetailClient";

function FundDetailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  if (!code || !/^\d{6}$/.test(code)) {
    // If no code, maybe show a placeholder or redirect
    return notFound();
  }

  return <FundCardDetailClient code={code} />;
}

export default function FundDetailPage() {
  return (
    <Suspense fallback={<div className="ui-page"><div className="ui-glass ui-panel compact"><div className="muted">加载中...</div></div></div>}>
      <FundDetailContent />
    </Suspense>
  );
}
