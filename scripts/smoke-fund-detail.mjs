import { getFundDetail } from '../app/lib/fundServer.js';

const samples = ['000001', '161725', '005919'];

for (const code of samples) {
  const detail = await getFundDetail(code);
  if (!detail || detail.code !== code) throw new Error(`Bad detail for ${code}`);
  if (!detail.name) throw new Error(`Missing name for ${code}`);
  console.log(`[ok] ${code} ${detail.name} nav=${detail.nav?.navUnit ?? '—'} est=${detail.nav?.estimateUnit ?? '—'} history=${detail.history?.length ?? 0}`);
}

