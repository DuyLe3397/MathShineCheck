import { Grade, Submission } from '../../models';
import { formatScore } from '../../shared/score';

/** Kết quả một Lần nộp: điểm số, 0 là Chấm không điểm, null là Lần nộp chờ chấm. */
export interface AttemptResult {
  attempt: number;
  score: number | null;
}

/** Ô điểm của một học sinh ở một bài: điểm cao nhất kèm kết quả từng Lần nộp. */
export interface GradeCell {
  assignmentId: string;
  score: number | null;
  attempts: AttemptResult[];
}

export interface StudentGradeRow {
  studentId: string;
  studentName: string;
  grades: GradeCell[];
  average: number | null;
}

export interface ScopedStudentRow {
  studentId: string;
  studentName: string;
  filteredGrades: GradeCell[];
  filteredAverage: number | null;
  gradedCount: number;
}

/**
 * Giữ lại điểm của các bài trong Phạm vi thống kê, rồi xếp học sinh theo
 * Độ đủ điểm giảm dần.
 */
export function rankStudentRows(rows: StudentGradeRow[], scopeAssignmentIds: string[]): ScopedStudentRow[] {
  const scope = new Set(scopeAssignmentIds);
  const scoped = rows.map(row => {
    const filteredGrades = row.grades.filter(g => scope.has(g.assignmentId));
    // Điểm 0 là Chấm không điểm, không tính là Bài có điểm.
    const validScores = filteredGrades.filter(g => g.score !== null && g.score !== 0).map(g => g.score as number);
    const filteredAverage =
      validScores.length > 0
        ? +(validScores.reduce((s, v) => s + v, 0) / validScores.length).toFixed(1)
        : null;
    return {
      studentId: row.studentId,
      studentName: row.studentName,
      filteredGrades,
      filteredAverage,
      gradedCount: validScores.length,
    };
  });
  scoped.sort((a, b) => b.gradedCount - a.gradedCount);
  return scoped;
}

/** Phạm vi thống kê của Bảng điểm học sinh: bỏ các Bài bị ẩn của em đó. */
export function studentScope(scopeAssignmentIds: string[], hiddenAssignmentIds: string[]): string[] {
  const hidden = new Set(hiddenAssignmentIds);
  return scopeAssignmentIds.filter(id => !hidden.has(id));
}

/**
 * Kết quả từng Lần nộp của một học sinh ở một bài, theo thứ tự số lần thật.
 * `submissions` và `grades` đã lọc sẵn cho đúng cặp học sinh – bài.
 */
export function attemptsOf(submissions: Submission[], grades: Grade[]): AttemptResult[] {
  const scoreBySubmission = new Map(grades.map(g => [g.submissionId, g.scoreValue]));
  const ordered = [...submissions].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const byAttempt = new Map<number, number | null>();
  ordered.forEach((s, i) => {
    const attempt = s.attemptNumber ?? i + 1;
    // Đã chấm mà không có bản ghi điểm thì coi như Chấm không điểm.
    const score = scoreBySubmission.get(s.id) ?? (s.status === 'graded' ? 0 : null);
    // Trùng số lần thì ưu tiên bản đã chấm.
    if (!byAttempt.has(attempt) || byAttempt.get(attempt) === null) byAttempt.set(attempt, score);
  });

  // Điểm cũ không gắn với Lần nộp nào vẫn phải hiện, đánh số tiếp theo.
  const submissionIds = new Set(submissions.map(s => s.id));
  let next = Math.max(0, ...byAttempt.keys());
  grades
    .filter(g => !submissionIds.has(g.submissionId))
    .sort((a, b) => a.gradedAt.localeCompare(b.gradedAt))
    .forEach(g => byAttempt.set(++next, g.scoreValue));

  return [...byAttempt]
    .sort(([a], [b]) => a - b)
    .map(([attempt, score]) => ({ attempt, score }));
}

/** Chuỗi hiển thị kết quả một Lần nộp: "chờ" khi chờ chấm, "-" khi Chấm không điểm. */
export function formatAttemptScore(score: number | null): string {
  return score === null ? 'chờ' : formatScore(score);
}

/** Ô của Bảng điểm nhóm ở chế độ Mọi lần nộp, ví dụ "6 → 8 → 9". */
export function attemptsLine(attempts: AttemptResult[]): string {
  return attempts.length > 0 ? attempts.map(a => formatAttemptScore(a.score)).join(' → ') : '-';
}
