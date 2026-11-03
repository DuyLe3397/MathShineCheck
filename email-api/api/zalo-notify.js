// POST /api/zalo-notify  body: {"submissionId":"<mã Lần nộp>"}
// Trình duyệt giáo viên gọi sau khi bấm nút đỏ "Lưu, Chấm điểm & Gửi Zalo cho HS"; API tự đọc Firestore rồi nhắn
// Zalo cho học sinh đã bật thông báo (tin điểm và/hoặc tin nhận xét). Logic ở lib/zalo.js.
import { applyCors, parseBody } from '../lib/http.js';
import { notifySubmissionSafe } from '../lib/zalo-run.js';

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
  const body = parseBody(req.body);
  if (typeof body?.submissionId !== 'string') return res.status(400).json({ error: 'bad-request' });
  const out = await notifySubmissionSafe(body.submissionId);
  return res.status(out.reason === 'error' ? 500 : 200).json(out);
}
