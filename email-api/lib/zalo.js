// Thông báo Zalo cho học sinh qua Zalo Bot (https://bot.zaloplatforms.com/docs/), xem "Thông báo Zalo" trong CONTEXT.md.
//
// Liên kết (một lần): trang học sinh tạo zaloLinks/<6 số> = { studentId }, học sinh nhắn mã đó cho bot,
// webhook đổi mã thành zaloChats/<studentId> = { chatId }. Nhắn "tắt" cho bot thì gỡ liên kết.
// Gửi: CHỈ khi giáo viên bấm nút đỏ "Lưu, Chấm điểm & Gửi Zalo cho HS"; trình duyệt gọi notifySubmission.
// zaloState/<mã Lần nộp> = { score, sentAt } nhớ lần gửi trước: tin điểm khi chưa báo điểm hoặc điểm khác lần báo
// trước; tin nhận xét khi có Nhận xét theo ảnh của giáo viên viết sau sentAt.
//
// Nội dung nhận xét KHÔNG được chép vào tin Zalo: collection comments ai cũng ghi được, nên chép nội dung sẽ biến
// bot thành chỗ gửi tin giả mạo tới học sinh. Tin chỉ báo số nhận xét kèm link về MathShine.
import { toPlainText } from './math-text.js';

const BOT_API = 'https://bot-api.zaloplatforms.com';
export const LINK_TTL_MS = 30 * 60 * 1000;
export const MAX_AGE_MS = 10 * 60 * 1000;
const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/** message: chuỗi thường, hoặc { text, styles } dựng bằng rich() để có chữ đậm/nghiêng/màu. */
export async function sendZaloMessage(chatId, message, { token = process.env.ZALO_BOT_TOKEN, fetchImpl = fetch } = {}) {
  if (!token || !chatId) return false;
  const { text, styles } = typeof message === 'string' ? { text: message, styles: [] } : message;
  const body = { chat_id: chatId, text: text.slice(0, 2000) };
  if (styles?.length) body.text_styles = styles;
  const res = await fetchImpl(`${BOT_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!json?.ok) console.error('zalo sendMessage failed', res.status, json?.error_code, json?.description);
  return !!json?.ok;
}

/** "MS-123456", "ms 123456" hoặc chỉ "123456" → "123456". */
export function parseLinkCode(text) {
  const t = String(text || '');
  const m = /\bMS[\s-]*(\d{6})\b/i.exec(t) || /^\s*(\d{6})\s*$/.exec(t);
  return m ? m[1] : null;
}

const isStop = (text) => /^\s*(tắt|tat|stop|huỷ|hủy|huy)\s*$/i.test(String(text || ''));

// Học sinh nhắn gì khác mã liên kết: bot tự giới thiệu. Zalo chưa bật thông báo thì kèm cách bật.
const HELP =
  'Tôi là bot của MathShine Check. Khi có điểm hoặc có cmt mới trong bài của bạn, tôi sẽ báo ở đây; ' +
  'bạn bấm vào link trong tin để xem trực tiếp.';
const HOW_TO_LINK =
  '\nĐể bật thông báo: mở MathShine, bấm "Nhận thông báo qua Zalo" rồi gửi mã hiện ra (dạng MS-123456) vào đây.';

/**
 * Xử lý một sự kiện webhook. db: { getDoc, queryDocs, putDoc, deleteDocument }; send(chatId, text).
 * Trả về chuỗi mô tả kết quả (để log và test).
 */
export async function handleUpdate(update, { db, send, now = Date.now() }) {
  if (update?.event_name !== 'message.text.received') return 'ignored';
  const msg = update.message || {};
  const chatId = msg.chat?.id;
  if (!chatId || (msg.chat?.chat_type && msg.chat.chat_type !== 'PRIVATE')) return 'ignored';

  if (isStop(msg.text)) {
    const linked = await db.queryDocs('zaloChats', { where: ['chatId', 'EQUAL', chatId] });
    for (const row of linked) await db.deleteDocument('zaloChats', row.id);
    await send(chatId, linked.length ? 'Đã tắt thông báo MathShine trên Zalo.' : 'Zalo này chưa bật thông báo MathShine.');
    return linked.length ? 'unlinked' : 'not-linked';
  }

  const code = parseLinkCode(msg.text);
  if (!code) {
    const linked = await db.queryDocs('zaloChats', { where: ['chatId', 'EQUAL', chatId] });
    await send(chatId, linked.length ? HELP : HELP + HOW_TO_LINK);
    return 'help';
  }

  const link = await db.getDoc('zaloLinks', code);
  const age = link ? now - Date.parse(link.createTime) : Infinity;
  const studentId = link?.data.studentId;
  const student = age <= LINK_TTL_MS && typeof studentId === 'string' && ID_RE.test(studentId)
    ? await db.getDoc('students', studentId)
    : null;
  if (!student) {
    await send(chatId, 'Mã không đúng hoặc đã hết hạn. Em vào MathShine bấm "Nhận thông báo qua Zalo" để lấy mã mới nhé.');
    return 'bad-code';
  }

  await db.putDoc('zaloChats', studentId, {
    chatId,
    zaloName: msg.from?.display_name || '',
    linkedAt: new Date(now).toISOString(),
  });
  await db.deleteDocument('zaloLinks', code);
  await send(
    chatId,
    `✅ Đã bật thông báo MathShine cho ${student.data.fullName || 'em'}.\n` +
      'Khi bài được chấm hoặc trợ giảng cmt bài của em, bot sẽ nhắn ở đây.',
  );
  return 'linked';
}

const fmtScore = (n) => (Number.isFinite(n) ? String(Math.round(n * 100) / 100).replace('.', ',') : '');
const resultsUrl = (appUrl, submissionId) => `${appUrl.replace(/\/+$/, '')}/student/results/${encodeURIComponent(submissionId)}`;

const clip = (t, n) => (t.length > n ? `${t.slice(0, n)}…` : t);

// Định dạng tin theo vị trí ký tự (text_styles của sendMessage), không dùng parse_mode markdown: tên bài và
// Nhận xét chung có thể chứa * _ ~ { } nên markdown sẽ hiểu nhầm. Vị trí tính theo UTF-16 = String.length của JS.
const B = ['b'];
const I = ['i'];
/** Màu điểm: từ 8 xanh lá, từ 5 đến dưới 8 cam, dưới 5 đỏ (bảng màu Zalo Bot). */
export const scoreColor = (n) => (n >= 8 ? 'c_15a85f' : n >= 5 ? 'c_f27806' : 'c_db342e');

/** parts: chuỗi thường hoặc [chuỗi, mã định dạng[]] → { text, styles } để gửi kèm text_styles. */
export function rich(parts) {
  let text = '';
  const styles = [];
  for (const p of parts) {
    const [t, st] = Array.isArray(p) ? p : [p];
    if (st?.length && t.length) styles.push({ start: text.length, len: t.length, st });
    text += t;
  }
  return { text, styles };
}
/** Tên tài khoản có thể đã gồm chữ "Trợ giảng" (vd. "Trợ giảng Đỗ Đạt"): bỏ đi để không lặp. */
const bareName = (fullName) => String(fullName || '').replace(/^\s*trợ\s*giảng\s*/iu, '').trim();

/**
 * Tính các tin cần gửi cho một Lần nộp so với lần gửi trước (zaloState).
 * Trả về { ok: true, chatId, messages: string[], state: { score, sentAt }, prev } hoặc { ok: false, reason }.
 */
export async function planSubmissionNotice(submissionId, { db, appUrl, now = Date.now() }) {
  if (typeof submissionId !== 'string' || !ID_RE.test(submissionId)) return { ok: false, reason: 'bad-id' };
  const submission = await db.getDoc('submissions', submissionId);
  const studentId = submission?.data.studentId;
  if (typeof studentId !== 'string' || !ID_RE.test(studentId)) return { ok: false, reason: 'no-submission' };
  const chat = await db.getDoc('zaloChats', studentId);
  if (!chat?.data.chatId) return { ok: false, reason: 'not-linked' };

  // grades chỉ giáo viên ghi được (luật Firestore). Nút đỏ vừa lưu điểm nên gradedAt phải mới.
  const [grade] = await db.queryDocs('grades', { where: ['submissionId', 'EQUAL', submissionId] });
  if (!grade) return { ok: false, reason: 'no-grade' };
  const age = now - Date.parse(grade.gradedAt);
  if (!(age >= -120_000 && age <= MAX_AGE_MS)) return { ok: false, reason: 'too-old' };

  const prev = await db.getDoc('zaloState', submissionId);
  const prevSentAt = prev ? Date.parse(prev.data.sentAt) : -Infinity;
  const scoreChanged = !prev || typeof prev.data.score !== 'number' || prev.data.score !== grade.scoreValue;

  const comments = (await db.queryDocs('comments', { where: ['submissionId', 'EQUAL', submissionId] }))
    .filter((c) => c.authorRole === 'teacher' && Date.parse(c.createdAt) > prevSentAt);
  const authorIds = [...new Set(comments.map((c) => c.authorId).filter((a) => typeof a === 'string' && ID_RE.test(a)))];
  const teachers = await Promise.all(authorIds.map((a) => db.getDoc('teachers', a)));
  // Chỉ tính nhận xét của tài khoản giáo viên có thật
  const realIds = new Set(authorIds.filter((_, i) => teachers[i]));
  const newComments = comments.filter((c) => realIds.has(c.authorId));

  if (!scoreChanged && newComments.length === 0) return { ok: false, reason: 'nothing-new' };

  const assignment = await db.getDoc('assignments', submission.data.assignmentId);
  const title = assignment?.data.title || 'bài tập';
  const attempt = submission.data.attemptNumber || 1;
  const link = resultsUrl(appUrl, submissionId);
  const messages = [];
  if (scoreChanged) {
    const overall = toPlainText(grade.comment || '').trim();
    // Điểm 0 là Chấm không điểm (CONTEXT.md): báo "đã được chấm", không ghi điểm, không tô màu
    const first = grade.scoreValue === 0
      ? ['📝 Bài ', [`"${title}"`, B], ` lần nộp ${attempt} của bạn `, ['đã được chấm', B], '.']
      : ['📝 Em vừa có điểm bài ', [`"${title}"`, B], ` lần nộp ${attempt}: `,
        [`${fmtScore(grade.scoreValue)} điểm`, [...B, scoreColor(grade.scoreValue)]], '.'];
    messages.push(rich([
      ...first,
      ...(overall ? ['\n', ['Nhận xét chung:', B], ' ', [clip(overall, 300), I]] : []),
      `\nBấm link để xem: ${link}`,
    ]));
  }
  if (newComments.length) {
    const names = teachers.filter(Boolean).map((t) => bareName(t.data.fullName)).filter(Boolean);
    const who = names.length ? `Trợ giảng ${names.join(', ')}` : 'Trợ giảng';
    messages.push(rich([
      '💬 ', [who, B], ' đã có ', [`${newComments.length} cmt`, B],
      ` vào lần nộp ${attempt} của bài `, [`"${title}"`, B], '.',
      `\nBấm link để xem: ${link}`,
    ]));
  }
  return {
    ok: true,
    chatId: chat.data.chatId,
    messages,
    state: { score: grade.scoreValue, sentAt: new Date(now).toISOString() },
    prev,
  };
}

/**
 * Nút đỏ: gửi tin điểm và/hoặc tin nhận xét cho một Lần nộp. db cần getDoc, queryDocs, writeDocIf, putDoc, deleteDocument.
 * Ghi zaloState trước khi gửi (có điều kiện, chống bấm hai lần cùng lúc); gửi lỗi thì trả lại trạng thái cũ.
 */
export async function notifySubmission(submissionId, { db, send, appUrl, now = Date.now() }) {
  const plan = await planSubmissionNotice(submissionId, { db, appUrl, now });
  if (!plan.ok) return { sent: 0, reason: plan.reason };
  const claimed = await db.writeDocIf('zaloState', submissionId, plan.state, plan.prev?.updateTime || null);
  if (!claimed) return { sent: 0, reason: 'busy' };
  let sent = 0;
  for (const message of plan.messages) {
    if (!(await send(plan.chatId, message))) break;
    sent++;
  }
  if (sent < plan.messages.length) {
    // Gửi chưa hết: trả lại phần trạng thái chưa báo được để lần bấm sau gửi lại phần còn thiếu
    const restore = sent === 0
      ? plan.prev?.data || null
      // Tin điểm đã đi, tin nhận xét lỗi: giữ điểm mới, lùi sentAt để nhận xét vẫn tính là mới
      : { score: plan.state.score, sentAt: plan.prev?.data.sentAt || new Date(0).toISOString() };
    if (restore) await db.putDoc('zaloState', submissionId, restore).catch(() => {});
    else await db.deleteDocument('zaloState', submissionId).catch(() => {});
    return { sent, reason: 'send-failed' };
  }
  return { sent };
}
