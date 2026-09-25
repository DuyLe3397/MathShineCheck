import { rankStudentRows, StudentGradeRow } from './statistics-ranking';

function row(studentName: string, scores: Record<string, number | null>): StudentGradeRow {
  const grades = Object.entries(scores).map(([assignmentId, score]) => ({ assignmentId, score }));
  return { studentName, grades, average: null };
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

  it('coi điểm 0 là Bài có điểm', () => {
    const rows = [
      row('Thiếu', { a1: 10, a2: null }),
      row('Có điểm 0', { a1: 0, a2: 0 }),
    ];

    expect(names(rankStudentRows(rows, ['a1', 'a2']))).toEqual(['Có điểm 0', 'Thiếu']);
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
