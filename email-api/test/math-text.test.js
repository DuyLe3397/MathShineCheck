import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEmail } from '../lib/build-email.js';
import { latexToLine, toPlainText } from '../lib/math-text.js';

const APP = 'https://mathshine-check-274.web.app';
const R = String.raw;

test('công thức → một dòng chữ', () => {
  assert.equal(latexToLine(R`\frac{x+1}{2x-3}`), '(x+1)/(2x−3)');
  assert.equal(latexToLine(R`\int_{0}^{1}\left(x^{2}+1\right)\,dx=\frac{4}{3}`), '∫₀¹(x²+1)dx=4/3');
  assert.equal(latexToLine(R`\lim_{x\to+\infty}\frac{2x+1}{x-3}=2`), 'lim(x→+∞) (2x+1)/(x−3)=2');
  assert.equal(latexToLine(R`\begin{cases}x+y=3\\2x-y=0\end{cases}`), '{ x+y=3; 2x−y=0 }');
  assert.equal(latexToLine(R`\begin{array}{l}x^2-4x+3=0\\ \mathstrut x=1\end{array}`), 'x²−4x+3=0\nx=1');
  assert.equal(toPlainText('Không có công thức, giá $5'), 'Không có công thức, giá $5');
});

test('email: công thức trong nội dung hiện dạng một dòng kèm lời nhắc mở trên MathShine', () => {
  const mail = buildEmail(
    {
      kind: 'comment', studentName: 'Nguyễn Văn A', groupLabel: 'Nhóm 1 · Toán 11', assignmentTitle: 'Giới hạn',
      submissionId: 'sub1', imageIndex: 0, createdAt: '2026-10-11T02:58:00Z',
      content: R`Câu 3: \(\lim_{x\to+\infty}\frac{2x+1}{x-3}=2\) đúng không ạ?`,
    },
    APP,
  );
  assert.ok(mail.text.includes('Câu 3: lim(x→+∞) (2x+1)/(x−3)=2 đúng không ạ?'));
  assert.ok(mail.text.includes('Mở trên MathShine để xem công thức'));
  assert.ok(!mail.html.includes('\\frac'));
});

test('email: nội dung không có công thức giữ nguyên, không có lời nhắc', () => {
  const mail = buildEmail(
    { kind: 'comment', studentName: 'A', groupLabel: 'G', assignmentTitle: 'T', submissionId: 's', imageIndex: 0, createdAt: '2026-10-11T02:58:00Z', content: 'Em chưa hiểu' },
    APP,
  );
  assert.ok(mail.text.includes('Em chưa hiểu'));
  assert.ok(!mail.text.includes('xem công thức'));
});
