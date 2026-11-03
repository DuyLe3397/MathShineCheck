// POST /api/zalo-webhook — Zalo Bot Platform gửi tin nhắn học sinh nhắn cho bot về đây (đăng ký bằng setWebhook).
// Mọi yêu cầu phải có header X-Bot-Api-Secret-Token đúng ZALO_WEBHOOK_SECRET. Logic ở lib/zalo.js.
import { timingSafeEqual } from 'node:crypto';
import { deleteDocument, getDoc, putDoc, queryDocs } from '../lib/firestore.js';
import { parseBody } from '../lib/http.js';
import { handleUpdate, sendZaloMessage } from '../lib/zalo.js';

function secretOk(got) {
  const want = process.env.ZALO_WEBHOOK_SECRET;
  if (!want || typeof got !== 'string') return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  if (!secretOk(req.headers['x-bot-api-secret-token'])) return res.status(403).json({ message: 'Unauthorized' });
  try {
    const outcome = await handleUpdate(parseBody(req.body), {
      db: { getDoc, queryDocs, putDoc, deleteDocument },
      send: (chatId, text) => sendZaloMessage(chatId, text),
    });
    console.log('zalo webhook', outcome);
  } catch (err) {
    console.error('zalo webhook failed', err);
  }
  // Luôn trả 200 để Zalo không gửi lại cùng sự kiện.
  return res.status(200).json({ ok: true });
}
