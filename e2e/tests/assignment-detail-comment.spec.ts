import { expect, test } from '@playwright/test';

const EMAIL = process.env['E2E_TEACHER_EMAIL'];
const PASSWORD = process.env['E2E_TEACHER_PASSWORD'];
const ASSIGNMENT_ID = process.env['E2E_ASSIGNMENT_ID'] ?? 'AdEjmwVFs2kmmjHz8woU';

test.skip(!EMAIL || !PASSWORD, 'Cần E2E_TEACHER_EMAIL và E2E_TEACHER_PASSWORD');

test('giáo viên thấy cột Nhận xét chung ngay sau cột Điểm trên trang chi tiết bài tập', async ({ page }) => {
  await page.goto('/auth/teacher/login');
  await page.locator('input[type="email"]').fill(EMAIL!);
  await page.locator('input[type="password"]').fill(PASSWORD!);
  await page.locator('button[type="submit"]').click();
  // Trang đăng nhập (/auth/teacher/login) cũng chứa "/teacher/", nên phải so đầu đường dẫn.
  await page.waitForURL((url) => url.pathname.startsWith('/teacher/'));

  await page.goto(`/teacher/assignments/${ASSIGNMENT_ID}`);
  const table = page.locator('table');
  // Trang tải điểm từng Lần nộp một, bài đông học sinh có thể mất hơn 5 giây.
  await expect(table.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 });

  const headers = (await table.locator('thead th').allTextContents()).map((h) => h.trim().toLowerCase());
  const commentCol = headers.indexOf('nhận xét chung');
  expect(commentCol, 'có cột Nhận xét chung').toBeGreaterThan(-1);
  expect(headers[commentCol - 1], 'cột nằm ngay sau cột Điểm').toBe('điểm');

  // Mọi dòng đều có ô nhận xét; Lần nộp chưa được chấm thì hiện "-".
  const statusCol = headers.indexOf('trạng thái');
  for (const row of await table.locator('tbody tr').all()) {
    const cells = (await row.locator('td').allTextContents()).map((c) => c.trim());
    expect(cells[commentCol], `dòng "${cells[0]}" có ô nhận xét`).toBeTruthy();
    if (cells[statusCol] !== 'Đã chấm') {
      expect(cells[commentCol], `dòng "${cells[0]}" chưa chấm`).toBe('-');
    }
  }
});
