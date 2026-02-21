const CODE39_PATTERNS = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
} as const;

type Code39Character = keyof typeof CODE39_PATTERNS;

const PRODUCT_CODE_MAX_LENGTH = 20;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeCodeSeed(name?: string): string {
  return (name || 'PRD')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export function generateProductBarcodeCode(name?: string): string {
  const seed = normalizeCodeSeed(name);
  const timestamp = Date.now().toString(36).toUpperCase().slice(-8);
  const random = Math.floor(Math.random() * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, '0');

  return `${seed || 'PRD'}-${timestamp}${random}`.slice(0, PRODUCT_CODE_MAX_LENGTH);
}

export function normalizeProductCodeForBarcode(value: string): string {
  return value
    .toUpperCase()
    .replace(/_/g, '-')
    .replace(/[^0-9A-Z.\- $/+%]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, PRODUCT_CODE_MAX_LENGTH);
}

export function createCode39Svg(code: string): string | null {
  const normalizedCode = normalizeProductCodeForBarcode(code);

  if (!normalizedCode) return null;

  const encodedValue = `*${normalizedCode}*`;
  const narrow = 2;
  const wide = 5;
  const characterGap = 2;
  const quietZone = 20;
  const barTop = 16;
  const barHeight = 78;
  const textY = 108;

  let x = quietZone;
  const rects: string[] = [];

  for (let charIndex = 0; charIndex < encodedValue.length; charIndex++) {
    const character = encodedValue[charIndex] as Code39Character;
    const pattern = CODE39_PATTERNS[character];

    if (!pattern) {
      return null;
    }

    for (let i = 0; i < pattern.length; i++) {
      const elementWidth = pattern[i] === 'w' ? wide : narrow;
      const isBar = i % 2 === 0;

      if (isBar) {
        rects.push(`<rect x="${x}" y="${barTop}" width="${elementWidth}" height="${barHeight}" />`);
      }

      x += elementWidth;
    }

    if (charIndex < encodedValue.length - 1) {
      x += characterGap;
    }
  }

  const width = x + quietZone;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 120" width="${width}" height="120" role="img" aria-label="Barcode for ${escapeHtml(normalizedCode)}">`,
    `<rect width="100%" height="100%" fill="white" />`,
    `<g fill="black">${rects.join('')}</g>`,
    `<text x="${width / 2}" y="${textY}" text-anchor="middle" font-family="monospace" font-size="14" fill="black">${escapeHtml(normalizedCode)}</text>`,
    '</svg>',
  ].join('');
}

export function openBarcodePrintDialog(code: string): boolean {
  const normalizedCode = normalizeProductCodeForBarcode(code);
  const barcodeSvg = createCode39Svg(normalizedCode);

  if (!normalizedCode || !barcodeSvg) {
    return false;
  }

  const title = `Barcode - ${normalizedCode}`;
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { margin: 12mm; }
          body {
            margin: 0;
            padding: 24px;
            font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            background: #ffffff;
            color: #0f172a;
          }
          .sheet {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 24px;
            max-width: 680px;
            margin: 0 auto;
          }
          .title {
            margin: 0 0 6px;
            font-size: 18px;
            font-weight: 700;
          }
          .subtitle {
            margin: 0 0 20px;
            font-size: 13px;
            color: #475569;
          }
          .barcode {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 12px;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            background: #fff;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <h1 class="title">Product Barcode</h1>
          <p class="subtitle">Code: <strong>${escapeHtml(normalizedCode)}</strong></p>
          <div class="barcode">${barcodeSvg}</div>
        </div>
      </body>
    </html>
  `;

  try {
    const printWindow = window.open('', '_blank');

    if (printWindow && printWindow.document) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      window.setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Fallback handled below when popup access fails.
        }
      }, 300);

      return true;
    }
  } catch {
    // Popup-based printing failed; fallback to iframe printing below.
  }

  if (!document.body) {
    return false;
  }

  const iframe = document.createElement('iframe');

  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;

    if (!frameWindow) return;

    frameWindow.focus();
    frameWindow.print();

    window.setTimeout(() => {
      iframe.remove();
    }, 1000);
  };

  document.body.appendChild(iframe);
  iframe.srcdoc = html;

  return true;
}
