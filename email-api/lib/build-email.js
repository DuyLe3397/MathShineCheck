// Dựng nội dung Email thông báo từ một sự kiện đã được xác minh.
// Link giống hệt chỗ mà nút Thông báo trên thanh của giáo viên mở tới.
// Công thức \(…\) không hiện được dạng xếp chồng trong email: chuyển thành một dòng chữ kèm lời nhắc mở trên MathShine.
import { hasFormula, toPlainText } from './math-text.js';

export function linkFor(event, appUrl) {
  const base = appUrl.replace(/\/+$/, '');
  switch (event.kind) {
    case 'submission':
      return `${base}/teacher/assignments/${encodeURIComponent(event.assignmentId)}`;
    case 'comment':
      return `${base}/teacher/grade/${encodeURIComponent(event.submissionId)}?comment=${event.imageIndex ?? 0}`;
    case 'discussion':
    case 'reply': {
      const q = new URLSearchParams({ discussion: event.discussionId, reply: event.replyId || '' });
      return `${base}/teacher/discussions?${q}`;
    }
    default:
      throw new Error(`Loại sự kiện không hỗ trợ: ${event.kind}`);
  }
}

export function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function headlineFor(e) {
  switch (e.kind) {
    case 'submission':
      return {
        label: '📤 Nộp bài',
        subject: `📤 ${e.studentName} nộp bài: ${e.assignmentTitle}${e.attemptNumber > 1 ? ` (lần ${e.attemptNumber})` : ''}`,
      };
    case 'comment':
      return {
        label: `📝 Bình luận trên ảnh ${(e.imageIndex ?? 0) + 1}`,
        subject: `📝 ${e.studentName} bình luận bài: ${e.assignmentTitle}`,
      };
    case 'discussion':
      return {
        label: '💬 Thảo luận mới',
        subject: `💬 ${e.studentName} mở thảo luận${e.discussionTitle ? `: ${e.discussionTitle}` : ''}`,
      };
    case 'reply':
      return {
        label: '💬 Trả lời thảo luận',
        subject: `💬 ${e.studentName} trả lời thảo luận${e.discussionTitle ? `: ${e.discussionTitle}` : ''}`,
      };
    default:
      throw new Error(`Loại sự kiện không hỗ trợ: ${e.kind}`);
  }
}

/** Trả về { subject, text, html } cho một sự kiện. */
export function buildEmail(event, appUrl) {
  const { label, subject } = headlineFor(event);
  const link = linkFor(event, appUrl);

  const rows = [
    ['Học sinh', event.studentName],
    ['Nhóm / Lớp', event.groupLabel],
    ['Bài tập', event.assignmentTitle],
    ['Thảo luận', event.kind === 'reply' ? event.discussionTitle : ''],
    ['Lần nộp', event.kind === 'submission' && event.attemptNumber ? `Lần ${event.attemptNumber}` : ''],
    ['Số ảnh', event.kind === 'submission' && event.imageCount ? String(event.imageCount) : ''],
    ['Thời gian', formatTime(event.createdAt)],
  ].filter(([, v]) => v);

  const content = toPlainText(event.content || '');
  const formulaNote = hasFormula(event.content) ? '(Mở trên MathShine để xem công thức dạng đầy đủ)' : '';
  const attachmentNote = [event.attachmentCount ? `(kèm ${event.attachmentCount} ảnh)` : '', formulaNote].filter(Boolean).join(' ');

  const text = [
    label,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(content || attachmentNote ? ['', 'Nội dung:', content, attachmentNote].filter((x) => x !== '') : []),
    '',
    `Mở trực tiếp: ${link}`,
  ].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;">
    <div style="font-size:13px;font-weight:700;color:#64748b;margin-bottom:8px;">MathShine Check</div>
    <div style="font-size:18px;font-weight:700;margin-bottom:16px;">${escapeHtml(label)}</div>
    <table style="border-collapse:collapse;font-size:14px;width:100%;">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#64748b;white-space:nowrap;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(v)}</td></tr>`,
        )
        .join('\n      ')}
    </table>
    ${
      content || attachmentNote
        ? `<div style="margin-top:16px;padding:12px 14px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:6px;font-size:14px;white-space:pre-wrap;">${escapeHtml(content)}${
            attachmentNote ? `<div style="color:#64748b;font-size:12px;margin-top:6px;">${escapeHtml(attachmentNote)}</div>` : ''
          }</div>`
        : ''
    }
    <a href="${escapeHtml(link)}" style="display:inline-block;margin-top:20px;padding:10px 18px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Mở trên MathShine</a>
    <div style="margin-top:12px;font-size:12px;color:#94a3b8;word-break:break-all;">${escapeHtml(link)}</div>
  </div>
</body></html>`;

  return { subject, text, html };
}
