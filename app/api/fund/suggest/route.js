import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = (searchParams.get('key') || '').trim();

  if (!key) {
    return NextResponse.json({ Datas: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const ts = Date.now();
  const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(key)}&_=${ts}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://fund.eastmoney.com/',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'upstream_error', status: res.status, Datas: [] },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    let data;
    try {
      data = await res.json();
    } catch {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { Datas: [] };
      }
    }

    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'fetch_failed', Datas: [] },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
