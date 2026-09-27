import { defineConfig } from '@playwright/test';

// Chạy trên app local (ng serve) nối với Firebase thật, bằng Chrome cài sẵn trên máy.
// Tài khoản giáo viên lấy từ biến môi trường, không ghi vào repo:
//   E2E_TEACHER_EMAIL, E2E_TEACHER_PASSWORD
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    channel: 'chrome',
    headless: false,
  },
});
