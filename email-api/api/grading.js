// API chỉ đọc cho skill chấm bài (/cham-bai, docs/adr/0007). Gọi từ Claude Code trên máy giáo viên, không từ trình duyệt.
// Mọi yêu cầu cần header  x-grading-key: <khóa của giáo viên>  (server chỉ giữ SHA-256 của khóa: GRADING_KEY_SHA256).
//
//   GET /api/grading?action=list&link=<đường dẫn chấm bài hoặc Chi tiết bài tập>
//       → bài tập (tên, mô tả) + các Lần nộp: chấm một bài thì đúng bài đó; cả lớp thì mọi dòng vàng "Đã nộp".
//   GET /api/grading?action=image&id=<mã ảnh>      → ảnh bài làm (JPEG), theo thứ tự trong imageIds của Lần nộp
//   GET /api/grading?action=comments&submission=<mã Lần nộp>
//       → bình luận của giáo viên và học sinh theo từng ảnh (kèm mã ảnh đính kèm và Ghi chú ảnh)
//   GET /api/grading?action=commentImage&id=<mã>  → ảnh đính kèm của bình luận
//   GET /api/grading?action=voice                  → ~30 nhận xét gần nhất của giáo viên, làm mẫu giọng văn
//
// Không ghi gì vào MathShine. Đọc Firestore qua REST như notify.js — dựa vào luật hiện cho đọc công khai;
// khi siết luật Firestore phải chuyển sang service account (xem ADR 0007).
import { createHash, timingSafeEqual } from 'node:crypto';
import { getDoc, queryDocs } from '../lib/firestore.js';
import { commentsByImage, decodeImage, parseGradingLink, submissionRows, voiceSamples } from '../lib/grading.js';

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

function authorized(req) {
  const expected = process.env.GRADING_KEY_SHA256;
  const key = req.headers['x-grading-key'];
  if (!expected || typeof key !== 'string' || !key) return false;
  const got = createHash('sha256').update(key).digest();
  const want = Buffer.from(expected, 'hex');
  return want.length === got.length && timingSafeEqual(got, want);
}

const appUrl = () => process.env.APP_URL || 'https://mathshine-check-274.web.app';

async function list(link) {
  const target = parseGradingLink(link);
  if (!target) return { status: 400, body: { error: 'bad-link' } };
  let assignmentId = target.id;
  if (target.kind === 'submission') {
    const sub = await getDoc('submissions', target.id);
    if (!sub) return { status: 404, body: { error: 'submission-not-found' } };
    assignmentId = sub.data.assignmentId;
  }
  const assignment = await getDoc('assignments', assignmentId);
  if (!assignment) return { status: 404, body: { error: 'assignment-not-found' } };
  const [students, submissions, grades] = await Promise.all([
    queryDocs('students', { where: ['groupId', 'EQUAL', assignment.data.groupId] }).then((s) => s.map((x) => ({ uid: x.uid || x.id, ...x }))),
    queryDocs('submissions', { where: ['assignmentId', 'EQUAL', assignmentId] }),
    queryDocs('grades', { where: ['assignmentId', 'EQUAL', assignmentId] }),
  ]);
  let rows = submissionRows(students, submissions, grades);
  rows = target.kind === 'submission' ? rows.filter((r) => r.submissionId === target.id) : rows.filter((r) => r.status === 'Đã nộp');
  return {
    status: 200,
    body: {
      scope: target.kind,
      assignment: { id: assignmentId, title: assignment.data.title || '', description: assignment.data.description || '', sessionDate: assignment.data.sessionDate || '' },
      submissions: rows.map((r) => ({ ...r, imageCount: r.imageIds.length, gradeUrl: `${appUrl()}/teacher/grade/${r.submissionId}` })),
    },
  };
}

async function voice() {
  const grades = await queryDocs('grades', { orderBy: ['gradedAt', 'DESCENDING'], limit: 30 });
  const ids = grades.map((g) => g.submissionId).filter(Boolean);
  const comments = [];
  for (let i = 0; i < ids.length; i += 30) {
    comments.push(...(await queryDocs('comments', { where: ['submissionId', 'IN', ids.slice(i, i + 30)] })));
  }
  return { status: 200, body: { samples: voiceSamples(grades, comments, 30) } };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method-not-allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  res.setHeader('Cache-Control', 'no-store');
  const { action, link, id } = req.query || {};
  try {
    if (action === 'image' || action === 'commentImage') {
      if (typeof id !== 'string' || !ID_RE.test(id)) return res.status(400).json({ error: 'bad-id' });
      const doc = await getDoc(action === 'image' ? 'submissionImages' : 'commentImages', id);
      const img = doc && decodeImage(doc.data.base64Data);
      if (!img) return res.status(404).json({ error: 'image-not-found' });
      res.setHeader('Content-Type', img.type);
      return res.status(200).send(img.bytes);
    }
    if (action === 'comments') {
      const subId = req.query.submission;
      if (typeof subId !== 'string' || !ID_RE.test(subId)) return res.status(400).json({ error: 'bad-id' });
      const sub = await getDoc('submissions', subId);
      if (!sub) return res.status(404).json({ error: 'submission-not-found' });
      const comments = await queryDocs('comments', { where: ['submissionId', 'EQUAL', subId] });
      return res.status(200).json({ images: commentsByImage(comments, (sub.data.imageIds || []).length) });
    }
    const out = action === 'list' ? await list(link) : action === 'voice' ? await voice() : { status: 400, body: { error: 'bad-action' } };
    return res.status(out.status).json(out.body);
  } catch (err) {
    console.error('grading failed', action, err);
    return res.status(500).json({ error: 'failed' });
  }
}
