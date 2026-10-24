// Logic thuần của API hỗ trợ chấm bài (api/grading.js, docs/adr/0007): tách đường dẫn, ghép Lần nộp như trang
// Chi tiết bài tập, chọn mẫu nhận xét. Không gọi mạng để test được.

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
  const sorted = [...comments].sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
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
