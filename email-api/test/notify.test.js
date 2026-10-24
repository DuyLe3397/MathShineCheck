import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEmail, linkFor } from '../lib/build-email.js';
import { decodeFields } from '../lib/firestore.js';
import { loadEvent } from '../lib/load-event.js';

const APP = 'https://mathshine-check-274.web.app';
const NOW = Date.parse('2026-10-11T03:00:00Z');
const FRESH = '2026-10-11T02:58:00Z';

function fakeDb(docs) {
  return async (collection, id) => {
    const d = docs[`${collection}/${id}`];
    return d ? { id, createTime: FRESH, updateTime: FRESH, ...d } : null;
  };
}

const base = {
  'students/s1': { data: { fullName: 'Nguyễn Văn A', groupId: 'g1', className: '9A' } },
  'groups/g1': { data: { name: 'Nhóm 1', classId: 'c1' } },
  'classes/c1': { data: { name: 'Toán 11' } },
  'assignments/a1': { data: { title: 'Hệ thức Vi-ét' } },
  'submissions/sub1': { data: { studentId: 's1', assignmentId: 'a1', imageIds: ['i1', 'i2'], attemptNumber: 2 } },
};

test('lần nộp mới của học sinh: đủ thông tin và link tới chi tiết bài tập', async () => {
  const r = await loadEvent('submission', 'sub1', { getDoc: fakeDb(base), now: NOW });
  assert.equal(r.ok, true);
  assert.equal(r.event.studentName, 'Nguyễn Văn A');
  assert.equal(r.event.groupLabel, 'Nhóm 1 · Toán 11');
  assert.equal(r.event.assignmentTitle, 'Hệ thức Vi-ét');
  assert.deepEqual(r.source, { collection: 'submissions', id: 'sub1', updateTime: FRESH });

  const mail = buildEmail(r.event, APP);
  assert.match(mail.subject, /Nguyễn Văn A nộp bài: Hệ thức Vi-ét \(lần 2\)/);
  assert.ok(mail.text.includes(`${APP}/teacher/assignments/a1`));
  assert.ok(mail.text.includes('Số ảnh: 2'));
});

test('nhận xét theo ảnh: link mở đúng ảnh trên trang chấm', async () => {
  const db = fakeDb({
    ...base,
    'comments/cm1': {
      data: { submissionId: 'sub1', imageIndex: 1, authorId: 's1', content: 'Em chưa hiểu <bước 2>', imageIds: ['x', 'y', 'z'] },
    },
  });
  const r = await loadEvent('comment', 'cm1', { getDoc: db, now: NOW });
  assert.equal(r.ok, true);
  const mail = buildEmail(r.event, APP);
  assert.ok(mail.text.includes('(kèm 3 ảnh)'));
  assert.ok(mail.text.includes(`${APP}/teacher/grade/sub1?comment=1`));
  assert.ok(mail.text.includes('Em chưa hiểu <bước 2>'));
  assert.ok(mail.html.includes('Em chưa hiểu &lt;bước 2&gt;'));
  assert.ok(mail.html.includes('ảnh 2'));
});

test('trả lời thảo luận: link tới đúng câu trả lời', async () => {
  const db = fakeDb({
    ...base,
    'discussions/d1': { data: { authorId: 's1', groupId: 'g1', content: 'Câu 3 làm sao ạ?' } },
    'discussionReplies/r1': { data: { discussionId: 'd1', authorId: 's1', content: 'Em làm được rồi' } },
  });
  const r = await loadEvent('reply', 'r1', { getDoc: db, now: NOW });
  assert.equal(r.ok, true);
  assert.equal(linkFor(r.event, APP), `${APP}/teacher/discussions?discussion=d1&reply=r1`);
  assert.match(buildEmail(r.event, APP).subject, /trả lời thảo luận: Câu 3 làm sao ạ\?/);
});

test('thảo luận mới: link không có reply', async () => {
  const db = fakeDb({ ...base, 'discussions/d1': { data: { authorId: 's1', content: 'Hỏi bài' } } });
  const r = await loadEvent('discussion', 'd1', { getDoc: db, now: NOW });
  assert.equal(linkFor(r.event, APP), `${APP}/teacher/discussions?discussion=d1&reply=`);
});

test('bỏ qua: giáo viên viết, đã gửi, quá cũ, không tồn tại, loại lạ', async () => {
  const db = fakeDb({
    ...base,
    'comments/byTeacher': { data: { submissionId: 'sub1', authorId: 't1', content: 'x' } },
    'comments/sent': { data: { submissionId: 'sub1', authorId: 's1', emailSentAt: FRESH } },
    'comments/old': { data: { submissionId: 'sub1', authorId: 's1' }, createTime: '2026-10-11T02:00:00Z' },
  });
  const reason = async (kind, id) => (await loadEvent(kind, id, { getDoc: db, now: NOW })).reason;
  assert.equal(await reason('comment', 'byTeacher'), 'not-student');
  assert.equal(await reason('comment', 'sent'), 'already-sent');
  assert.equal(await reason('comment', 'old'), 'too-old');
  assert.equal(await reason('comment', 'missing'), 'not-found');
  assert.equal(await reason('grade', 'sub1'), 'unknown-kind');
});

test('giải mã field Firestore REST', () => {
  assert.deepEqual(
    decodeFields({
      s: { stringValue: 'a' },
      n: { integerValue: '3' },
      arr: { arrayValue: { values: [{ stringValue: 'x' }] } },
      m: { mapValue: { fields: { b: { booleanValue: true } } } },
      z: { nullValue: null },
    }),
    { s: 'a', n: 3, arr: ['x'], m: { b: true }, z: null },
  );
});
