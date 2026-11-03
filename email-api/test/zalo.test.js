import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleUpdate, notifySubmission, parseLinkCode } from '../lib/zalo.js';

const APP = 'https://mathshine-check-274.web.app';
const NOW = Date.parse('2026-11-02T03:00:00Z');
const FRESH = '2026-11-02T02:58:00Z';
const OLD = '2026-11-02T01:00:00Z';

function fakeDb(docs) {
  const store = new Map(Object.entries(docs));
  return {
    store,
    async getDoc(collection, id) {
      const d = store.get(`${collection}/${id}`);
      return d ? { id, createTime: d.createTime || FRESH, updateTime: `v${d.v || 0}`, data: d.data } : null;
    },
    async queryDocs(collection, { where }) {
      const [field, , value] = where;
      return [...store.entries()]
        .filter(([k, d]) => k.startsWith(`${collection}/`) && d.data[field] === value)
        .map(([k, d]) => ({ id: k.split('/')[1], ...d.data }));
    },
    async putDoc(collection, id, data) {
      store.set(`${collection}/${id}`, { data });
    },
    async writeDocIf(collection, id, data, updateTime) {
      const cur = store.get(`${collection}/${id}`);
      if (updateTime ? !cur || `v${cur.v || 0}` !== updateTime : cur) return false;
      store.set(`${collection}/${id}`, { data, v: (cur?.v || 0) + 1 });
      return true;
    },
    async createDocWithId(collection, id, data) {
      if (store.has(`${collection}/${id}`)) return false;
      store.set(`${collection}/${id}`, { data });
      return true;
    },
    async deleteDocument(collection, id) {
      store.delete(`${collection}/${id}`);
    },
  };
}

function recorder() {
  const sent = [];
  return { sent, send: async (chatId, m) => (sent.push({ chatId, text: typeof m === 'string' ? m : m.text, styles: m.styles || [] }), true) };
}

const textMsg = (text, chatId = 'chat1') => ({
  event_name: 'message.text.received',
  message: { text, chat: { id: chatId, chat_type: 'PRIVATE' }, from: { id: chatId, display_name: 'Ted' } },
});

const base = {
  'students/s1': { data: { fullName: 'Nguyễn Văn A' } },
  'teachers/t1': { data: { fullName: 'Lê Duy' } },
  'assignments/a1': { data: { title: 'Hàm số bậc hai' } },
  'submissions/sub1': { data: { studentId: 's1', assignmentId: 'a1' } },
  'zaloChats/s1': { data: { chatId: 'chat1' } },
  'grades/g1': { data: { submissionId: 'sub1', scoreValue: 8.5, comment: 'Tốt, xem lại \\(x^2\\)', gradedAt: FRESH } },
  'comments/c1': { data: { submissionId: 'sub1', authorRole: 'teacher', authorId: 't1', content: 'Sai dấu' } },
};

test('đọc mã liên kết ở nhiều dạng', () => {
  assert.equal(parseLinkCode('MS-123456'), '123456');
  assert.equal(parseLinkCode('ms 654321'), '654321');
  assert.equal(parseLinkCode(' 111222 '), '111222');
  assert.equal(parseLinkCode('xin chào'), null);
  assert.equal(parseLinkCode('12345'), null);
});

test('học sinh gửi mã đúng: lưu chatId, xóa mã, bot xác nhận', async () => {
  const db = fakeDb({ 'students/s1': base['students/s1'], 'zaloLinks/123456': { data: { studentId: 's1' } } });
  const r = recorder();
  assert.equal(await handleUpdate(textMsg('MS-123456'), { db, send: r.send, now: NOW }), 'linked');
  assert.equal(db.store.get('zaloChats/s1').data.chatId, 'chat1');
  assert.equal(db.store.has('zaloLinks/123456'), false);
  assert.match(r.sent[0].text, /Đã bật thông báo MathShine cho Nguyễn Văn A/);
});

test('mã hết hạn hoặc sai: không liên kết', async () => {
  const db = fakeDb({ 'students/s1': base['students/s1'], 'zaloLinks/123456': { createTime: OLD, data: { studentId: 's1' } } });
  const r = recorder();
  assert.equal(await handleUpdate(textMsg('MS-123456'), { db, send: r.send, now: NOW }), 'bad-code');
  assert.equal(await handleUpdate(textMsg('MS-999999'), { db, send: r.send, now: NOW }), 'bad-code');
  assert.equal(db.store.has('zaloChats/s1'), false);
});

test('tin thường thì trả hướng dẫn; "tắt" thì gỡ liên kết', async () => {
  const db = fakeDb({ 'zaloChats/s1': { data: { chatId: 'chat1' } } });
  const r = recorder();
  assert.equal(await handleUpdate(textMsg('xin chào'), { db, send: r.send, now: NOW }), 'help');
  assert.match(r.sent[0].text, /^Tôi là bot của MathShine Check\. Khi có điểm hoặc có cmt mới/);
  assert.ok(!r.sent[0].text.includes('Để bật thông báo'));
  assert.equal(await handleUpdate(textMsg('Tắt'), { db, send: r.send, now: NOW }), 'unlinked');
  assert.equal(db.store.has('zaloChats/s1'), false);
  // Zalo chưa bật thông báo: kèm cách bật
  await handleUpdate(textMsg('alo'), { db, send: r.send, now: NOW });
  assert.match(r.sent.at(-1).text, /bấm vào link trong tin để xem trực tiếp\.\nĐể bật thông báo: mở MathShine/);
});

test('tin trong nhóm hoặc sự kiện khác bị bỏ qua', async () => {
  const db = fakeDb({});
  const r = recorder();
  const group = textMsg('MS-123456');
  group.message.chat.chat_type = 'GROUP';
  assert.equal(await handleUpdate(group, { db, send: r.send, now: NOW }), 'ignored');
  assert.equal(await handleUpdate({ event_name: 'message.sticker.received' }, { db, send: r.send, now: NOW }), 'ignored');
  assert.equal(r.sent.length, 0);
});

const T0 = '2026-11-02T02:50:00Z';
const notice = (db, sent, now = NOW) => notifySubmission('sub1', { db, send: sent.send, appUrl: APP, now });
const withData = (extra) => fakeDb({
  ...base,
  'submissions/sub1': { data: { studentId: 's1', assignmentId: 'a1', attemptNumber: 2 } },
  'grades/g1': { data: { submissionId: 'sub1', scoreValue: 8.5, comment: 'Tốt, xem lại \\(x^2\\)', gradedAt: FRESH } },
  'comments/c1': { data: { submissionId: 'sub1', authorRole: 'teacher', authorId: 't1', content: 'Sai dấu', createdAt: T0 } },
  ...extra,
});

test('lần đầu bấm nút đỏ: tin điểm (có lần nộp, Nhận xét chung dạng chữ) rồi tin nhận xét', async () => {
  const r = recorder();
  const out = await notice(withData({}), r);
  assert.equal(out.sent, 2);
  assert.equal(r.sent[0].chatId, 'chat1');
  assert.match(r.sent[0].text, /^📝 Em vừa có điểm bài "Hàm số bậc hai" lần nộp 2: 8,5 điểm\./);
  assert.match(r.sent[0].text, /Nhận xét chung: Tốt, xem lại/);
  assert.ok(!r.sent[0].text.includes('\\('));
  assert.match(r.sent[0].text, /xem lại x/);
  assert.ok(r.sent[0].text.includes(`Bấm link để xem: ${APP}/student/results/sub1`));
  assert.match(r.sent[1].text, /^💬 Trợ giảng Lê Duy đã có 1 cmt vào lần nộp 2 của bài "Hàm số bậc hai"\./);
  assert.ok(!r.sent[1].text.includes('Sai dấu'));
});

test('bấm lại không có gì mới: không gửi; có nhận xét mới: chỉ tin nhận xét; đổi điểm: chỉ tin điểm', async () => {
  const db = withData({});
  const r = recorder();
  await notice(db, r);
  assert.equal((await notice(db, r)).reason, 'nothing-new');
  // Chỉ sửa Nhận xét chung: không gửi
  db.store.get('grades/g1').data.comment = 'Nhận xét khác';
  assert.equal((await notice(db, r)).reason, 'nothing-new');
  // Nhận xét mới của hai giáo viên (một tên đã có chữ "Trợ giảng")
  db.store.set('teachers/t2', { data: { fullName: 'Trợ giảng Đỗ Đạt' } });
  db.store.set('comments/c2', { data: { submissionId: 'sub1', authorRole: 'teacher', authorId: 't2', createdAt: '2026-11-02T03:01:00Z' } });
  db.store.set('comments/c3', { data: { submissionId: 'sub1', authorRole: 'teacher', authorId: 't1', createdAt: '2026-11-02T03:02:00Z' } });
  db.store.set('comments/c4', { data: { submissionId: 'sub1', authorRole: 'student', authorId: 's1', createdAt: '2026-11-02T03:02:00Z' } });
  const later = Date.parse('2026-11-02T03:05:00Z');
  r.sent.length = 0;
  assert.equal((await notice(db, r, later)).sent, 1);
  assert.match(r.sent[0].text, /^💬 Trợ giảng (Đỗ Đạt, Lê Duy|Lê Duy, Đỗ Đạt) đã có 2 cmt vào/);
  // Đổi điểm
  db.store.get('grades/g1').data.scoreValue = 9;
  db.store.get('grades/g1').data.gradedAt = '2026-11-02T03:05:00Z';
  r.sent.length = 0;
  assert.equal((await notice(db, r, later)).sent, 1);
  assert.match(r.sent[0].text, /9 điểm/);
});

test('không gửi: chưa bật Zalo, điểm cũ, nhận xét giả danh giáo viên không được tính', async () => {
  const r = recorder();
  const { ['zaloChats/s1']: _, ...rest } = base;
  assert.equal((await notifySubmission('sub1', { db: fakeDb({ ...rest, 'grades/g1': base['grades/g1'] }), send: r.send, appUrl: APP, now: NOW })).reason, 'not-linked');
  assert.equal((await notice(withData({ 'grades/g1': { data: { submissionId: 'sub1', scoreValue: 8, gradedAt: OLD } } }), r)).reason, 'too-old');
  const db = withData({ 'comments/c1': { data: { submissionId: 'sub1', authorRole: 'teacher', authorId: 'fake', createdAt: T0 } } });
  await notice(db, r);
  assert.equal(r.sent.length, 1);
  assert.match(r.sent[0].text, /Em vừa có điểm/);
});

test('gửi lỗi thì trả lại trạng thái để lần bấm sau gửi lại', async () => {
  const db = withData({});
  assert.equal((await notice(db, { send: async () => false })).reason, 'send-failed');
  assert.equal(db.store.has('zaloState/sub1'), false);
  // Tin điểm đi được, tin nhận xét lỗi: lần sau chỉ gửi lại tin nhận xét
  let n = 0;
  await notice(db, { send: async () => ++n === 1 });
  const r = recorder();
  assert.equal((await notice(db, r)).sent, 1);
  assert.match(r.sent[0].text, /^💬/);
});

test('định dạng: tên bài và điểm in đậm, điểm tô màu theo mức, Nhận xét chung nhãn đậm nội dung nghiêng', async () => {
  const r = recorder();
  await notice(withData({}), r);
  const { text, styles } = r.sent[0];
  const at = (s) => styles.find((x) => text.slice(x.start, x.start + x.len) === s)?.st;
  assert.deepEqual(at('"Hàm số bậc hai"'), ['b']);
  assert.deepEqual(at('8,5 điểm'), ['b', 'c_15a85f']);
  assert.deepEqual(at('Nhận xét chung:'), ['b']);
  assert.ok(styles.some((x) => x.st.includes('i') && text.slice(x.start).startsWith('Tốt, xem lại')));
  const c = r.sent[1];
  const cat = (s) => c.styles.find((x) => c.text.slice(x.start, x.start + x.len) === s)?.st;
  assert.deepEqual(cat('Trợ giảng Lê Duy'), ['b']);
  assert.deepEqual(cat('1 cmt'), ['b']);
});

test('màu điểm: từ 8 xanh lá, 5 đến dưới 8 cam, dưới 5 đỏ', async () => {
  const { scoreColor } = await import('../lib/zalo.js');
  assert.equal(scoreColor(8), 'c_15a85f');
  assert.equal(scoreColor(7.75), 'c_f27806');
  assert.equal(scoreColor(5), 'c_f27806');
  assert.equal(scoreColor(4.5), 'c_db342e');
});

test('Chấm không điểm (điểm 0): báo đã được chấm, không ghi điểm, không tô màu', async () => {
  const r = recorder();
  await notice(withData({ 'grades/g1': { data: { submissionId: 'sub1', scoreValue: 0, comment: '', gradedAt: FRESH } } }), r);
  assert.match(r.sent[0].text, /^📝 Bài "Hàm số bậc hai" lần nộp 2 của bạn đã được chấm\.\nBấm link để xem: /);
  assert.ok(!r.sent[0].text.includes('điểm'));
  assert.ok(!r.sent[0].styles.some((x) => x.st.some((s) => s.startsWith('c_'))));
});
