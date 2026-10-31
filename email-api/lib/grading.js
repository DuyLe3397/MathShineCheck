// Logic thuần của API hỗ trợ chấm bài (api/grading.js, docs/adr/0007): tách đường dẫn, ghép Lần nộp như trang
// Chi tiết bài tập, chọn mẫu nhận xét, kiểm Ảnh đã chấm và bình luận skill đăng (docs/adr/0009). Không gọi mạng để test được.
import { createHash } from 'node:crypto';

const ID = '[A-Za-z0-9_-]{1,128}';

/** Đường dẫn trang chấm bài (/teacher/grade/<mã bài nộp>) hoặc Chi tiết bài tập (/teacher/assignments/<mã bài>). */
export function parseGradingLink(link) {
  let path;
  try {
    path = new URL(String(link)).pathname;
  } catch {
    path = String(link || '');
  }
  const sub = new RegExp(`/teacher/grade/(${ID})/?$`).exec(path);
  if (sub) return { kind: 'submission', id: sub[1] };
  const asg = new RegExp(`/teacher/assignments/(${ID})/?$`).exec(path);
  if (asg) return { kind: 'assignment', id: asg[1] };
  return null;
}

const hasScore = (g) => !!g && g.scoreValue !== undefined && g.scoreValue !== null;

/**
 * Các dòng của bảng Chi tiết bài tập (src/app/pages/teacher/assignment-detail.component.ts, buildRows):
 * mỗi học sinh trong nhóm, mỗi Lần nộp một dòng. Trùng Lần nộp thì ưu tiên bản đã có điểm, rồi bản nộp sau cùng.
 * "Đã chấm" (xanh) khi có điểm, còn lại "Đã nộp" (vàng). Học sinh chưa nộp không có dòng.
 */
export function submissionRows(students, submissions, grades) {
  const gradeOf = (subId) => grades.find((g) => g && g.submissionId === subId) || null;
  const rows = [];
  for (const student of students) {
    const byAttempt = new Map();
    for (const sub of submissions.filter((s) => s.studentId === student.uid)) {
      const attempt = sub.attemptNumber || 1;
      const existing = byAttempt.get(attempt);
      if (!existing) { byAttempt.set(attempt, sub); continue; }
      const existingGraded = hasScore(gradeOf(existing.id)), subGraded = hasScore(gradeOf(sub.id));
      if (!existingGraded && subGraded) byAttempt.set(attempt, sub);
      else if (!existingGraded && !subGraded && (sub.submittedAt || '') > (existing.submittedAt || '')) byAttempt.set(attempt, sub);
    }
    const subs = [...byAttempt.values()].sort((a, b) => (b.attemptNumber || 0) - (a.attemptNumber || 0));
    for (const sub of subs) {
      rows.push({
        submissionId: sub.id,
        studentId: student.uid,
        studentName: student.fullName || student.username || student.uid,
        className: student.className || '',
        attemptNumber: sub.attemptNumber || 1,
        submittedAt: sub.submittedAt || '',
        imageIds: sub.imageIds || [],
        status: hasScore(gradeOf(sub.id)) ? 'Đã chấm' : 'Đã nộp',
      });
    }
  }
  return rows;
}

/** Mẫu giọng văn: nhận xét chung (điểm) và nhận xét theo ảnh của giáo viên, mới nhất trước, bỏ trùng và rỗng. */
export function voiceSamples(grades, comments, limit = 30) {
  const items = [
    ...grades.map((g) => ({ kind: 'Nhận xét chung', text: g.comment, at: g.gradedAt })),
    ...comments.filter((c) => c.authorRole === 'teacher').map((c) => ({ kind: 'Nhận xét theo ảnh', text: c.content, at: c.createdAt })),
  ];
  const seen = new Set();
  return items
    .filter((i) => typeof i.text === 'string' && i.text.trim())
    .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))
    .filter((i) => { const k = i.text.trim(); if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, limit)
    .map(({ kind, text }) => ({ kind, text: text.trim() }));
}

/**
 * Bình luận của một Lần nộp xếp theo ảnh (Ảnh 1, 2, … như trang chấm bài; thiếu imageIndex là ảnh đầu), cũ trước.
 * Mỗi bình luận kèm ảnh đính kèm (mã ảnh + Ghi chú ảnh).
 */
export function commentsByImage(comments, imageCount) {
  const images = Array.from({ length: Math.max(imageCount, 1) }, (_, i) => ({ image: i + 1, comments: [] }));
  // Bình luận skill tự đăng lần chấm trước không phải ngữ cảnh của giáo viên: chấm lại thì người chấm viết lại từ đầu
  const sorted = comments.filter((c) => c.source !== 'cham-bai').sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  for (const c of sorted) {
    const i = Math.min(Math.max(Number(c.imageIndex) || 0, 0), images.length - 1);
    const ids = Array.isArray(c.imageIds) ? c.imageIds : [];
    images[i].comments.push({
      authorRole: c.authorRole === 'teacher' ? 'teacher' : 'student',
      authorName: c.authorName || '',
      content: typeof c.content === 'string' ? c.content : '',
      createdAt: c.createdAt || '',
      attachments: ids.map((id, k) => ({ id, note: (c.imageNotes || [])[k] || '' })),
    });
  }
  return images;
}

/** Ảnh lưu dạng data URL base64 (có thể thiếu tiền tố). Trả về { type, bytes } hoặc null. */
export function decodeImage(base64Data) {
  if (typeof base64Data !== 'string' || !base64Data) return null;
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(base64Data);
  const type = m ? m[1] : 'image/jpeg';
  const bytes = Buffer.from(m ? m[2] : base64Data, 'base64');
  return bytes.length ? { type, bytes } : null;
}

export const MAX_COMMENT = 4000;
const badContent = (content) => typeof content !== 'string' || !content.trim() || content.length > MAX_COMMENT;

/**
 * Bình luận theo ảnh do skill đăng thay giáo viên ra bài (docs/adr/0009), giống bình luận gửi từ trang chấm bài.
 * Trả về { fields } hoặc { status, error }. `source: 'cham-bai'` đánh dấu để chỉ sửa lại được bình luận của skill.
 */
export function gradingComment({ imageIds, imageIndex, content, teacherId, teacher, profile }) {
  if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= (imageIds || []).length) return { status: 400, error: 'bad-image-index' };
  if (badContent(content)) return { status: 400, error: 'bad-content' };
  if (!teacherId || !teacher) return { status: 404, error: 'teacher-not-found' };
  return {
    fields: {
      imageIndex, authorId: teacherId, authorName: teacher.fullName || '', authorAvatarUrl: profile?.avatarUrl || '',
      authorRole: 'teacher', content: content.trim(), imageIds: [], imageNotes: [], source: 'cham-bai',
    },
  };
}

/** Sửa nội dung một bình luận skill đã đăng: phải là bình luận của skill, đúng Lần nộp và đúng ảnh. */
export function checkCommentUpdate({ existing, submission, imageIndex, content }) {
  if (!existing) return { status: 404, error: 'comment-not-found' };
  if (existing.source !== 'cham-bai' || existing.submissionId !== submission || existing.imageIndex !== imageIndex) {
    return { status: 403, error: 'not-skill-comment' };
  }
  if (badContent(content)) return { status: 400, error: 'bad-content' };
  return { content: content.trim() };
}

// Giống giới hạn của nút "Tải ảnh đã chấm" (image.service compressImage): document Firestore tối đa 1MB
export const MAX_IMAGE_DATA_URL = 900000;

/**
 * Kiểm một Ảnh đã chấm trước khi ghi đè ảnh bài làm. Trả về { dataUrl } hoặc { status, error }.
 * - Ảnh phải thuộc đúng Lần nộp.
 * - Ảnh trên server phải còn đúng bản skill đã lấy về (expectSha256): giáo viên vừa vẽ hay tải ảnh khác lên thì không đè.
 * - Ảnh mới phải là JPEG và không quá MAX_IMAGE_DATA_URL.
 */
export function checkGradedUpload({ imageIds, imageId, currentBase64Data, expectSha256, jpegBase64 }) {
  if (!(imageIds || []).includes(imageId)) return { status: 400, error: 'image-not-in-submission' };
  const current = decodeImage(currentBase64Data);
  if (!current) return { status: 404, error: 'image-not-found' };
  if (createHash('sha256').update(current.bytes).digest('hex') !== expectSha256) return { status: 409, error: 'image-changed' };
  if (typeof jpegBase64 !== 'string' || !/^[A-Za-z0-9+/]+=*$/.test(jpegBase64)) return { status: 400, error: 'bad-image' };
  const bytes = Buffer.from(jpegBase64, 'base64');
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return { status: 400, error: 'not-jpeg' };
  const dataUrl = `data:image/jpeg;base64,${jpegBase64}`;
  if (dataUrl.length > MAX_IMAGE_DATA_URL) return { status: 413, error: 'image-too-large' };
  return { dataUrl };
}
