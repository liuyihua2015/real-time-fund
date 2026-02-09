import { NextResponse } from 'next/server';
import { getFundDetail } from '../../../lib/fundServer';

export async function GET(_req, { params }) {
  const code = params?.code;
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  }
  try {
    const detail = await getFundDetail(code);
    return NextResponse.json(detail, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }
}

