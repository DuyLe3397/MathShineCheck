/**
 * Điểm 0 nghĩa là Chấm không điểm: giáo viên đã chấm nhưng không cho điểm
 * (xem docs/adr/0002-diem-0-la-cham-khong-diem.md).
 */

/** Chuỗi hiển thị điểm: "-" khi Chấm không điểm hoặc chưa có điểm. */
export function formatScore(score: number | null | undefined): string {
  return score == null || score === 0 ? '-' : String(score);
}

/** Điểm cao nhất giữa các Lần nộp; null nếu không có Lần nộp nào có điểm. */
export function bestScore(scores: number[]): number | null {
  const scored = scores.filter((s) => s !== 0);
  return scored.length > 0 ? Math.max(...scored) : null;
}
