// POST /api/notify  body: {"kind":"submission|comment|discussion|reply","id":"<mã document>"}
// Trình duyệt học sinh gọi sau khi ghi dữ liệu; API tự đọc Firestore rồi gửi Email thông báo.
import nodemailer from 'nodemailer';
import { buildEmail } from '../lib/build-email.js';
import { getDoc, claimEmail, releaseEmail } from '../lib/firestore.js';
import { loadEvent } from '../lib/load-event.js';

const DEFAULT_ORIGINS = [
  'https://mathshine-check-274.web.app',
  'https://mathshine-check-274.firebaseapp.com',
  'http://localhost:4200',
];

let transporter;
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  return transporter;
}

function applyCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || DEFAULT_ORIGINS;
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

function parseBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' ? body : null;
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });

  const body = parseBody(req.body);
  const kind = body?.kind;
  const id = body?.id;
  if (typeof kind !== 'string' || typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    return res.status(400).json({ error: 'bad-request' });
  }

  try {
    // Document gốc có thể bị client cập nhật ngay sau khi tạo (vd. lastReplyAt),
    // làm precondition hỏng; đọc lại và thử giành quyền gửi vài lần.
    for (let attempt = 0; attempt < 3; attempt++) {
      const loaded = await loadEvent(kind, id, { getDoc });
      if (!loaded.ok) return res.status(200).json({ sent: false, reason: loaded.reason });

      const { collection, updateTime } = loaded.source;
      if (!(await claimEmail(collection, id, updateTime))) continue;

      const { subject, text, html } = buildEmail(
        loaded.event,
        process.env.APP_URL || 'https://mathshine-check-274.web.app',
      );
      try {
        await getTransporter().sendMail({
          from: `"MathShine Check" <${process.env.GMAIL_USER}>`,
          to: process.env.MAIL_TO,
          subject,
          text,
          html,
        });
      } catch (err) {
        await releaseEmail(collection, id);
        throw err;
      }
      return res.status(200).json({ sent: true });
    }
    return res.status(200).json({ sent: false, reason: 'claim-failed' });
  } catch (err) {
    console.error('notify failed', kind, id, err);
    return res.status(500).json({ error: 'send-failed' });
  }
}
