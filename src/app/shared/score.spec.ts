import { bestScore, formatScore } from './score';

describe('formatScore', () => {
  it('hiện đúng con số khi có điểm', () => {
    expect(formatScore(7.5)).toBe('7.5');
    expect(formatScore(10)).toBe('10');
  });

  it('hiện "-" khi Chấm không điểm hoặc chưa có điểm', () => {
    expect(formatScore(0)).toBe('-');
    expect(formatScore(null)).toBe('-');
    expect(formatScore(undefined)).toBe('-');
  });
});

describe('bestScore', () => {
  it('lấy điểm cao nhất giữa các Lần nộp', () => {
    expect(bestScore([6, 9, 7])).toBe(9);
  });

  it('bỏ qua Lần nộp Chấm không điểm (điểm 0)', () => {
    expect(bestScore([0, 4])).toBe(4);
  });

  it('không có điểm khi mọi Lần nộp đều Chấm không điểm, hoặc chưa được chấm lần nào', () => {
    expect(bestScore([0, 0])).toBeNull();
    expect(bestScore([])).toBeNull();
  });
});
