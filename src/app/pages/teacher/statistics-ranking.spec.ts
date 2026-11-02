import { Grade, Submission } from '../../models';
import {
  attemptsLine,
  attemptsOf,
  formatAttemptScore,
  rankStudentRows,
  StudentGradeRow,
  studentScope,
} from './statistics-ranking';

function row(studentName: string, scores: Record<string, number | null>): StudentGradeRow {
  const grades = Object.entries(scores).map(([assignmentId, score]) => ({ assignmentId, score, attempts: [] }));
  return { studentId: studentName, studentName, grades, average: null };
}

function submission(id: string, attemptNumber: number | undefined, submittedAt: string, status: Submission['status'] = 'submitted'): Submission {
  return { id, assignmentId: 'a1', studentId: 's1', imageIds: [], attemptNumber, status, submittedAt };
}

function grade(submissionId: string, scoreValue: number, gradedAt = '2026-09-01T00:00:00Z'): Grade {
  return { id: 'g-' + submissionId, submissionId, studentId: 's1', assignmentId: 'a1', scoreValue, comment: '', gradedBy: 't', gradedAt };
}

const names = (rows: { studentName: string }[]) => rows.map(r => r.studentName);

describe('rankStudentRows', () => {
  it('xếp học sinh đủ điểm trước học sinh thiếu điểm', () => {
    const rows = [
      row('Thiếu', { a1: 8, a2: null }),
      row('Đủ', { a1: 7, a2: 9 }),
    ];

    expect(names(rankStudentRows(rows, ['a1', 'a2']))).toEqual(['Đủ', 'Thiếu']);
  });

  it('xếp theo Độ đủ điểm giảm dần, học sinh chưa có điểm bài nào đứng cuối', () => {
    const rows = [
      row('Trống', { a1: null, a2: null, a3: null }),
      row('Một bài', { a1: null, a2: 6, a3: null }),
      row('Đủ ba', { a1: 5, a2: 6, a3: 7 }),
      row('Hai bài', { a1: 9, a2: null, a3: 10 }),
    ];

    expect(names(rankStudentRows(rows, ['a1', 'a2', 'a3']))).toEqual(['Đủ ba', 'Hai bài', 'Một bài', 'Trống']);
  });

  it('không tính bài ngoài Phạm vi thống kê vào Độ đủ điểm', () => {
    const rows = [
      row('Có điểm bài ngoài', { a1: 8, a2: null, ngoai: 9 }),
      row('Đủ trong phạm vi', { a1: 6, a2: 6, ngoai: null }),
    ];

    expect(names(rankStudentRows(rows, ['a1', 'a2']))).toEqual(['Đủ trong phạm vi', 'Có điểm bài ngoài']);
  });

  it('coi Chấm không điểm (điểm 0) là Bài thiếu điểm', () => {
    const rows = [
      row('Chấm không điểm', { a1: 0, a2: 0 }),
      row('Một bài có điểm', { a1: 10, a2: null }),
    ];

    expect(names(rankStudentRows(rows, ['a1', 'a2']))).toEqual(['Một bài có điểm', 'Chấm không điểm']);
  });

  it('không tính Chấm không điểm vào điểm TB', () => {
    const [an, binh] = rankStudentRows(
      [row('An', { a1: 8, a2: 0, a3: 6 }), row('Bình', { a1: 0 })],
      ['a1', 'a2', 'a3'],
    );

    expect(an.filteredAverage).toBe(7);
    expect(binh.filteredAverage).toBeNull();
  });

  it('học sinh cùng Độ đủ điểm giữ nguyên thứ tự ban đầu', () => {
    const rows = [
      row('Chi', { a1: 5, a2: null }),
      row('An', { a1: 10, a2: 10 }),
      row('Bình', { a1: null, a2: 9 }),
      row('Dũng', { a1: 4, a2: null }),
    ];

    expect(names(rankStudentRows(rows, ['a1', 'a2']))).toEqual(['An', 'Chi', 'Bình', 'Dũng']);
  });

  it('tính điểm TB chỉ trên các bài có điểm trong phạm vi, làm tròn 1 chữ số', () => {
    const rows = [row('An', { a1: 7, a2: 8, a3: null, ngoai: 2 })];

    const [an] = rankStudentRows(rows, ['a1', 'a2', 'a3']);

    expect(an.filteredAverage).toBe(7.5);
    expect(an.filteredGrades.map(g => g.assignmentId)).toEqual(['a1', 'a2', 'a3']);
  });

  it('điểm TB là null khi không có bài nào có điểm', () => {
    const [an] = rankStudentRows([row('An', { a1: null })], ['a1']);

    expect(an.filteredAverage).toBeNull();
  });
});

describe('studentScope', () => {
  it('bỏ các Bài bị ẩn khỏi Phạm vi thống kê, giữ thứ tự bài', () => {
    expect(studentScope(['a1', 'a2', 'a3'], ['a2', 'bai-nhom-cu'])).toEqual(['a1', 'a3']);
  });
});

describe('attemptsOf', () => {
  it('liệt kê kết quả từng Lần nộp theo số lần thật, kể cả khi có lần đã bị xóa', () => {
    const attempts = attemptsOf(
      [submission('s3', 3, '2026-09-03'), submission('s1', 1, '2026-09-01')],
      [grade('s1', 6), grade('s3', 9)],
    );

    expect(attempts).toEqual([{ attempt: 1, score: 6 }, { attempt: 3, score: 9 }]);
  });

  it('Lần nộp chưa có điểm là chờ chấm, điểm 0 là Chấm không điểm', () => {
    const attempts = attemptsOf(
      [submission('s1', 1, '2026-09-01'), submission('s2', 2, '2026-09-02')],
      [grade('s1', 0)],
    );

    expect(attempts).toEqual([{ attempt: 1, score: 0 }, { attempt: 2, score: null }]);
  });

  it('Lần nộp đã chấm mà không có bản ghi điểm là Chấm không điểm', () => {
    expect(attemptsOf([submission('s1', 1, '2026-09-01', 'graded')], [])).toEqual([{ attempt: 1, score: 0 }]);
  });

  it('Lần nộp cũ chưa có số lần được đánh số theo thời gian nộp', () => {
    const attempts = attemptsOf(
      [submission('sau', undefined, '2026-09-05'), submission('truoc', undefined, '2026-09-01')],
      [grade('truoc', 5), grade('sau', 7)],
    );

    expect(attempts).toEqual([{ attempt: 1, score: 5 }, { attempt: 2, score: 7 }]);
  });

  it('hai bản ghi trùng số lần thì giữ bản đã chấm', () => {
    const attempts = attemptsOf(
      [submission('chua', 1, '2026-09-01'), submission('da', 1, '2026-09-01')],
      [grade('da', 8)],
    );

    expect(attempts).toEqual([{ attempt: 1, score: 8 }]);
  });

  it('điểm không gắn với Lần nộp nào vẫn hiện, đánh số tiếp sau lần cuối', () => {
    const attempts = attemptsOf([submission('s1', 1, '2026-09-01')], [grade('s1', 6), grade('mo-coi', 8)]);

    expect(attempts).toEqual([{ attempt: 1, score: 6 }, { attempt: 2, score: 8 }]);
  });
});

describe('hiển thị Mọi lần nộp', () => {
  it('ghi "chờ" cho Lần nộp chờ chấm và "-" cho Chấm không điểm', () => {
    expect(formatAttemptScore(null)).toBe('chờ');
    expect(formatAttemptScore(0)).toBe('-');
    expect(formatAttemptScore(8.5)).toBe('8.5');
  });

  it('nối các lần bằng mũi tên, chưa nộp lần nào thì là "-"', () => {
    expect(attemptsLine([{ attempt: 1, score: 6 }, { attempt: 2, score: 0 }, { attempt: 3, score: null }])).toBe('6 → - → chờ');
    expect(attemptsLine([])).toBe('-');
  });
});
