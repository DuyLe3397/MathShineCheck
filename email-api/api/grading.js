// API cho skill chấm bài (/cham-bai, docs/adr/0007, 0009). Gọi từ Claude Code trên máy giáo viên, không từ trình duyệt.
// Mọi yêu cầu cần header  x-grading-key: <khóa của giáo viên>  (server chỉ giữ SHA-256 của khóa: GRADING_KEY_SHA256).
//
//   GET /api/grading?action=list&link=<đường dẫn chấm bài hoặc Chi tiết bài tập>
//       → bài tập (tên, mô tả) + các Lần nộp: chấm một bài thì đúng bài đó; cả lớp thì mọi dòng vàng "Đã nộp".
//   GET /api/grading?action=image&id=<mã ảnh>      → ảnh bài làm (JPEG), theo thứ tự trong imageIds của Lần nộp
//   GET /api/grading?action=comments&submission=<mã Lần nộp>
//       → bình luận của giáo viên và học sinh theo từng ảnh (kèm mã ảnh đính kèm và Ghi chú ảnh)
//   GET /api/grading?action=commentImage&id=<mã>  → ảnh đính kèm của bình luận
//   GET /api/grading?action=voice[&teacher=<uid>]  → ~30 nhận xét gần nhất (của giáo viên đó nếu có), làm mẫu giọng văn
//   POST /api/grading?action=uploadGraded  { submission, imageId, expectSha256, jpegBase64 }
//       → ghi Ảnh đã chấm đè lên ảnh bài làm, như nút "Tải ảnh đã chấm" (ADR 0009). Chỉ ghi khi ảnh trên server còn
//         đúng bản skill đã lấy về (SHA-256), để không đè nét vẽ giáo viên vừa thêm.
//   POST /api/grading?action=postComment  { submission, imageIndex, content, commentId? }
//       → đăng bình luận theo ảnh dưới tên giáo viên ra bài (ADR 0009); có commentId thì sửa nội dung bình luận
//         skill đã đăng trước đó (chỉ bình luận có source 'cham-bai').
//
// Chỉ ghi base64Data của submissionImages và bình luận của skill. Đọc/ghi Firestore qua REST như notify.js — dựa vào
// luật hiện cho đọc/ghi công khai; khi siết luật Firestore phải chuyển sang service account (xem ADR 0007).
import { createHash, timingSafeEqual } from 'node:crypto';
import { createDoc, getDoc, queryDocs, setStringField } from '../lib/firestore.js';
import {
  checkCommentUpdate, checkGradedUpload, commentsByImage, decodeImage, gradingComment, parseGradingLink, submissionRows,
  voiceSamples,
} from '../lib/grading.js';

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
      assignment: {
        id: assignmentId, title: assignment.data.title || '', description: assignment.data.description || '',
        sessionDate: assignment.data.sessionDate || '', createdBy: assignment.data.createdBy || '',
      },
      submissions: rows.map((r) => ({ ...r, imageCount: r.imageIds.length, gradeUrl: `${appUrl()}/teacher/grade/${r.submissionId}` })),
    },
  };
}

// teacher: chỉ lấy nhận xét của đúng giáo viên đó (giáo viên ra bài), để skill viết đúng giọng người đó.
// Không có nhận xét nào của giáo viên đó thì lấy của mọi giáo viên.
async function voice(teacher) {
  let grades = await queryDocs('grades', { orderBy: ['gradedAt', 'DESCENDING'], limit: teacher ? 100 : 30 });
  const mine = teacher ? grades.filter((g) => g.gradedBy === teacher) : [];
  if (mine.length) grades = mine.slice(0, 30);
  const ids = grades.map((g) => g.submissionId).filter(Boolean);
  let comments = [];
  for (let i = 0; i < ids.length; i += 30) {
    comments.push(...(await queryDocs('comments', { where: ['submissionId', 'IN', ids.slice(i, i + 30)] })));
  }
  if (mine.length) comments = comments.filter((c) => c.authorId === teacher);
  // Bình luận skill tự đăng không phải giọng giáo viên viết tay: không lấy làm mẫu
  comments = comments.filter((c) => c.source !== 'cham-bai');
  return { status: 200, body: { samples: voiceSamples(grades, comments, 30) } };
}

async function postComment(body) {
  const { submission, imageIndex, content, commentId } = body || {};
  if (typeof submission !== 'string' || !ID_RE.test(submission)) return { status: 400, body: { error: 'bad-id' } };
  if (commentId !== undefined && (typeof commentId !== 'string' || !ID_RE.test(commentId))) return { status: 400, body: { error: 'bad-id' } };
  const sub = await getDoc('submissions', submission);
  if (!sub) return { status: 404, body: { error: 'submission-not-found' } };
  if (commentId) {
    const existing = await getDoc('comments', commentId);
    const checked = checkCommentUpdate({ existing: existing?.data, submission, imageIndex, content });
    if (checked.error) return { status: checked.status, body: { error: checked.error } };
    const ok = await setStringField('comments', commentId, 'content', checked.content, existing.updateTime);
    return ok ? { status: 200, body: { id: commentId } } : { status: 409, body: { error: 'comment-changed' } };
  }
  const assignment = await getDoc('assignments', sub.data.assignmentId);
  const teacherId = assignment?.data.createdBy;
  const [teacher, profile] = teacherId && ID_RE.test(teacherId)
    ? await Promise.all([getDoc('teachers', teacherId), getDoc('userProfiles', teacherId)])
    : [null, null];
  const checked = gradingComment({
    imageIds: sub.data.imageIds, imageIndex, content, teacherId, teacher: teacher?.data, profile: profile?.data,
  });
  if (checked.error) return { status: checked.status, body: { error: checked.error } };
  const id = await createDoc('comments', { ...checked.fields, submissionId: submission, createdAt: new Date().toISOString() });
  return { status: 200, body: { id } };
}

async function uploadGraded(body) {
  const { submission, imageId, expectSha256, jpegBase64 } = body || {};
  if (![submission, imageId].every((x) => typeof x === 'string' && ID_RE.test(x))) return { status: 400, body: { error: 'bad-id' } };
  const [sub, image] = await Promise.all([getDoc('submissions', submission), getDoc('submissionImages', imageId)]);
  if (!sub) return { status: 404, body: { error: 'submission-not-found' } };
  const checked = checkGradedUpload({
    imageIds: sub.data.imageIds, imageId, currentBase64Data: image?.data.base64Data, expectSha256, jpegBase64,
  });
  if (checked.error) return { status: checked.status, body: { error: checked.error } };
  // Precondition updateTime: có người ghi ảnh giữa lúc đọc và lúc ghi thì không đè
  const ok = await setStringField('submissionImages', imageId, 'base64Data', checked.dataUrl, image.updateTime);
  return ok ? { status: 200, body: { ok: true } } : { status: 409, body: { error: 'image-changed' } };
}

export default async function handler(req, res) {
  const { action, link, id } = req.query || {};
  const write = { uploadGraded, postComment }[action];
  if (req.method !== (write ? 'POST' : 'GET')) return res.status(405).json({ error: 'method-not-allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (write) {
      const out = await write(req.body);
      return res.status(out.status).json(out.body);
    }
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
    const out = action === 'list' ? await list(link) : action === 'voice' ? await voice(ID_RE.test(req.query.teacher || '') ? req.query.teacher : '') : { status: 400, body: { error: 'bad-action' } };
    return res.status(out.status).json(out.body);
  } catch (err) {
    console.error('grading failed', action, err);
    return res.status(500).json({ error: 'failed' });
  }
}
