'use client';

function pickRecognize(mod) {
  if (typeof mod?.recognize === 'function') return mod.recognize;
  if (typeof mod?.default?.recognize === 'function') return mod.default.recognize;
  return null;
}

export async function recognizeImage(file, options = {}) {
  const { lang = 'chi_sim+eng', onProgress } = options || {};
  const mod = await import('tesseract.js');
  const recognize = pickRecognize(mod);
  if (!recognize) throw new Error('OCR 初始化失败');

  const result = await recognize(file, lang, {
    logger: (m) => {
      if (!m) return;
      if (typeof onProgress === 'function') onProgress(m);
    }
  });

  return String(result?.data?.text || '');
}

