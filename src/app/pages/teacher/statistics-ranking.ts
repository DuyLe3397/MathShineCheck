export interface StudentGradeRow {
  studentName: string;
  grades: { assignmentId: string; score: number | null }[];
  average: number | null;
}

export interface ScopedStudentRow {
  studentName: string;
  filteredGrades: { assignmentId: string; score: number | null }[];
  filteredAverage: number | null;
}

/**
 * Giữ lại điểm của các bài trong Phạm vi thống kê, rồi xếp học sinh theo
 * Độ đủ điểm giảm dần.
 */
export function rankStudentRows(rows: StudentGradeRow[], scopeAssignmentIds: string[]): ScopedStudentRow[] {
  const scope = new Set(scopeAssignmentIds);
  const scoped = rows.map(row => {
    const filteredGrades = row.grades.filter(g => scope.has(g.assignmentId));
    const validScores = filteredGrades.filter(g => g.score !== null).map(g => g.score as number);
    const filteredAverage =
      validScores.length > 0
        ? +(validScores.reduce((s, v) => s + v, 0) / validScores.length).toFixed(1)
        : null;
    return {
      row: { studentName: row.studentName, filteredGrades, filteredAverage },
      gradedCount: validScores.length,
    };
  });
  scoped.sort((a, b) => b.gradedCount - a.gradedCount);
  return scoped.map(s => s.row);
}
