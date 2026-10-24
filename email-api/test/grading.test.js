import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGradingLink, submissionRows, voiceSamples, decodeImage, commentsByImage } from '../lib/grading.js';

test('tách đường dẫn chấm bài và chi tiết bài tập', () => {
  assert.deepEqual(parseGradingLink('https://mathshine-check-274.web.app/teacher/grade/Csw93BdZeaTeetegYOgc_jtSDiro1KuxlKy3AS5fN_1'),
    { kind: 'submission', id: 'Csw93BdZeaTeetegYOgc_jtSDiro1KuxlKy3AS5fN_1' });
  assert.deepEqual(parseGradingLink('http://localhost:4200/teacher/assignments/abc123/'), { kind: 'assignment', id: 'abc123' });
  assert.equal(parseGradingLink('https://mathshine-check-274.web.app/student/home'), null);
  assert.equal(parseGradingLink('https://x/teacher/grade/../../etc'), null);
});

test('dòng vàng/xanh giống trang Chi tiết bài tập', () => {
  const students = [{ uid: 's1', fullName: 'An' }, { uid: 's2', fullName: 'Bình' }, { uid: 's3', fullName: 'Chưa nộp' }];
  const submissions = [
    { id: 'a1', studentId: 's1', attemptNumber: 1, submittedAt: '2026-10-01', imageIds: ['i1'] },
    { id: 'a2', studentId: 's1', attemptNumber: 2, submittedAt: '2026-10-03', imageIds: ['i2', 'i3'] },
    // Trùng Lần nộp 1 của s2: bản đã chấm được giữ dù nộp trước
    { id: 'b1', studentId: 's2', attemptNumber: 1, submittedAt: '2026-10-01' },
    { id: 'b1x', studentId: 's2', attemptNumber: 1, submittedAt: '2026-10-02' },
    { id: 'z', studentId: 'người-ngoài-nhóm', attemptNumber: 1 },
  ];
  const grades = [{ submissionId: 'a1', scoreValue: 8 }, { submissionId: 'b1', scoreValue: 0 }];
  const rows = submissionRows(students, submissions, grades);
  assert.deepEqual(rows.map((r) => [r.submissionId, r.status]), [['a2', 'Đã nộp'], ['a1', 'Đã chấm'], ['b1', 'Đã chấm']]);
  assert.deepEqual(rows[0].imageIds, ['i2', 'i3']);
});

test('trùng Lần nộp chưa chấm thì lấy bản nộp sau cùng; điểm null là chưa chấm', () => {
  const rows = submissionRows([{ uid: 's', fullName: 'S' }],
    [{ id: 'x', studentId: 's', attemptNumber: 1, submittedAt: '1' }, { id: 'y', studentId: 's', attemptNumber: 1, submittedAt: '2' }],
    [{ submissionId: 'x', scoreValue: null }]);
  assert.deepEqual(rows.map((r) => [r.submissionId, r.status]), [['y', 'Đã nộp']]);
});

test('mẫu giọng văn: chỉ của giáo viên, mới nhất trước, bỏ trùng/rỗng', () => {
  const s = voiceSamples(
    [{ comment: 'Làm tốt', gradedAt: '2026-10-02' }, { comment: '', gradedAt: '2026-10-05' }],
    [{ authorRole: 'teacher', content: 'Sai dấu ở dòng 3', createdAt: '2026-10-04' },
      { authorRole: 'student', content: 'Em cảm ơn', createdAt: '2026-10-06' },
      { authorRole: 'teacher', content: 'Làm tốt ', createdAt: '2026-10-01' }],
    10);
  assert.deepEqual(s, [{ kind: 'Nhận xét theo ảnh', text: 'Sai dấu ở dòng 3' }, { kind: 'Nhận xét chung', text: 'Làm tốt' }]);
});

test('bình luận xếp theo ảnh, cũ trước, kèm ảnh đính kèm và Ghi chú ảnh', () => {
  const images = commentsByImage([
    { imageIndex: 1, authorRole: 'teacher', authorName: 'Thầy', content: 'Sai dấu', createdAt: '2', imageIds: ['k1'], imageNotes: ['chữa'] },
    { authorRole: 'student', authorName: 'An', content: 'Em làm lại câu 2', createdAt: '3' },
    { imageIndex: 1, authorRole: 'student', authorName: 'An', content: 'Dạ', createdAt: '1' },
    { imageIndex: 9, authorRole: 'student', authorName: 'An', content: 'ngoài phạm vi', createdAt: '4' },
  ], 2);
  assert.deepEqual(images.map((i) => [i.image, i.comments.map((c) => c.content)]),
    [[1, ['Em làm lại câu 2']], [2, ['Dạ', 'Sai dấu', 'ngoài phạm vi']]]);
  assert.deepEqual(images[1].comments[1].attachments, [{ id: 'k1', note: 'chữa' }]);
});

test('giải mã ảnh data URL', () => {
  const img = decodeImage('data:image/jpeg;base64,' + Buffer.from('abc').toString('base64'));
  assert.equal(img.type, 'image/jpeg');
  assert.equal(img.bytes.toString(), 'abc');
  assert.equal(decodeImage(''), null);
});
