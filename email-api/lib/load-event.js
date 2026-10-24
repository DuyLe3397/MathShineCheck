// Xác minh một sự kiện từ Firestore và gom dữ liệu để dựng Email thông báo.
// Chỉ nhận sự kiện có thật, mới tạo, do học sinh viết và chưa được gửi email.
import { toPlainText } from './math-text.js';

export const SOURCE_COLLECTION = {
  submission: 'submissions',
  comment: 'comments',
  discussion: 'discussions',
  reply: 'discussionReplies',
};

export const MAX_AGE_MS = 10 * 60 * 1000;

async function groupLabelFor(student, getDoc) {
  const groupId = student.groupId;
  const group = groupId ? await getDoc('groups', groupId) : null;
  const cls = group?.data.classId ? await getDoc('classes', group.data.classId) : null;
  // Tên nhóm/lớp thường đã có sẵn chữ "Nhóm"/"Toán 11", nên giữ nguyên tên.
  const groupName = group?.data.name || '';
  const className = cls?.data.name || student.className || '';
  return [groupName, className].filter(Boolean).join(' · ');
}

/**
 * Trả về { ok: true, event, source } hoặc { ok: false, reason }.
 * `source` là document gốc cần đánh dấu emailSentAt.
 */
export async function loadEvent(kind, id, { getDoc, now = Date.now() }) {
  const collection = SOURCE_COLLECTION[kind];
  if (!collection) return { ok: false, reason: 'unknown-kind' };

  const doc = await getDoc(collection, id);
  if (!doc) return { ok: false, reason: 'not-found' };
  if (doc.data.emailSentAt) return { ok: false, reason: 'already-sent' };

  const age = now - Date.parse(doc.createTime);
  if (!(age >= -60_000 && age <= MAX_AGE_MS)) return { ok: false, reason: 'too-old' };

  const d = doc.data;
  const authorId = kind === 'submission' ? d.studentId : d.authorId;
  const studentDoc = await getDoc('students', authorId);
  if (!studentDoc) return { ok: false, reason: 'not-student' };
  const student = studentDoc.data;

  const event = {
    kind,
    id,
    studentName: student.fullName || d.authorName || '',
    groupLabel: await groupLabelFor(student, getDoc),
    createdAt: d.createdAt || d.submittedAt || doc.createTime,
    content: d.content || '',
    // Ảnh đính kèm của bình luận/thảo luận (imageIds của bài nộp là ảnh bài làm, không tính ở đây).
    attachmentCount:
      kind !== 'submission' && Array.isArray(d.imageIds) && d.imageIds.length
        ? d.imageIds.length
        : d.imageUrl
          ? 1
          : 0,
  };

  if (kind === 'submission') {
    const assignment = await getDoc('assignments', d.assignmentId);
    Object.assign(event, {
      assignmentId: d.assignmentId,
      assignmentTitle: assignment?.data.title || '',
      attemptNumber: d.attemptNumber || 0,
      imageCount: Array.isArray(d.imageIds) ? d.imageIds.length : 0,
    });
  } else if (kind === 'comment') {
    const submission = await getDoc('submissions', d.submissionId);
    const assignment = submission ? await getDoc('assignments', submission.data.assignmentId) : null;
    Object.assign(event, {
      submissionId: d.submissionId,
      imageIndex: d.imageIndex ?? 0,
      assignmentTitle: assignment?.data.title || '',
    });
  } else if (kind === 'discussion') {
    Object.assign(event, {
      discussionId: id,
      replyId: '',
      discussionTitle: d.title || '',
    });
  } else if (kind === 'reply') {
    const discussion = await getDoc('discussions', d.discussionId);
    const dd = discussion?.data;
    Object.assign(event, {
      discussionId: d.discussionId,
      replyId: id,
      // Đổi công thức thành chữ trước khi cắt, để không cắt ngang giữa một \(…\)
      discussionTitle: dd?.title || toPlainText(dd?.content || '').slice(0, 60),
    });
  }

  return { ok: true, event, source: { collection, id, updateTime: doc.updateTime } };
}
