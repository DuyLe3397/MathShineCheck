// Phần dùng chung cho các API gọi từ trình duyệt MathShine.

const DEFAULT_ORIGINS = [
  'https://mathshine-check-274.web.app',
  'https://mathshine-check-274.firebaseapp.com',
  'http://localhost:4200',
];

export function applyCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || DEFAULT_ORIGINS;
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

export function parseBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' ? body : null;
}
