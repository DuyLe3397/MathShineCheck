---
name: playwright-automation
description: Điều khiển một cửa sổ Chrome thật (không headless) qua Playwright để nhập dữ liệu mẫu theo bộ testcase hoặc chụp ảnh minh họa màn hình thật cho tài liệu HDSD, trên dự án Angular 17 + DevExtreme. Dùng khi cần demo/nhập liệu mẫu qua UI thật hoặc chụp screenshot thật cho tài liệu.
---

# Nhập liệu / chụp ảnh màn hình thật bằng Playwright (chạy trên Chrome, xem được trực tiếp)

Đúc kết từ quá trình dùng Playwright để nhập dữ liệu mẫu và chụp ảnh minh họa cho module Quản lý Nhân sự đại lý & Đào tạo.

## 1. Role

Bạn là kỹ sư automation, điều khiển **một cửa sổ Chrome thật** để người dùng xem trực tiếp thao tác (không chạy ẩn/headless), thực hiện đúng luồng nghiệp vụ qua giao diện — không insert thẳng dữ liệu vào database.

## 2. Mục tiêu

- Nhập dữ liệu mẫu thực tế cho 1 chức năng đã hoàn thiện, theo đúng bộ `Testcase_<ten_chuc_nang>.xlsx` (nếu có, xem skill `gen-testcase`).
- Hoặc: chụp ảnh minh họa các màn hình/tab/popup thật để gắn vào tài liệu HDSD (xem skill `gen-hdsd`).

## 3. Quy tắc bắt buộc

- Dữ liệu nhập phải hợp lý, có ý nghĩa (tên người/mã/email thật dạng mẫu), không nhập rác vô nghĩa.
- Bug phát hiện được trong lúc thao tác thật (lỗi 500, lỗi validate sai, dữ liệu hiển thị sai...) là **bug thật của ứng dụng**, không phải lỗi automation — phải dừng lại, xác định root cause, sửa code, build lại rồi mới tiếp tục, **không né tránh** bằng cách đổi sang dữ liệu khác cho qua.
- Không tự ý khởi động lại/dừng backend hoặc frontend của người dùng — nếu phát hiện service không phản hồi, báo người dùng và chờ họ xử lý.
- Dữ liệu debug/test tạm (đặt để dò lỗi selector) phải dọn lại qua đúng chức năng Xóa trên UI sau khi xong, không đụng thẳng DB.

## 4. Setup một lần cho dự án

```bash
mkdir AI-Research/playwright && cd AI-Research/playwright
npm init -y
npm install playwright
```

Không cài `playwright` vào `package.json` của `fe/` (tránh lẫn dependency của app thật). Không chạy `npx playwright install` — dùng thẳng Chrome đã cài sẵn trên máy qua `channel: 'chrome'`, không cần tải thêm browser riêng của Playwright.

## 5. Mở Chrome độc lập (sống ngoài vòng đời script Node)

**Không** launch Chrome bằng `chromium.launch()` của Playwright cho mục đích này — trình duyệt đó sẽ tự đóng ngay khi script Node kết thúc, không giữ được phiên đăng nhập giữa nhiều lần chạy script. Thay vào đó mở Chrome như 1 process hệ điều hành độc lập:

```powershell
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$profileDir = "d:\...\AI-Research\playwright\chrome-profile"
Start-Process -FilePath $chromePath -ArgumentList `
  "--remote-debugging-port=9222", "--user-data-dir=$profileDir", `
  "--no-first-run", "--no-default-browser-check", "http://localhost:4200"
```

Mọi script sau đó chỉ **kết nối vào** cửa sổ đang mở qua CDP, không tạo cửa sổ mới:

```js
// connect.js
const { chromium } = require('playwright');
async function getPage() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const pages = context.pages();
  const page = pages.find((p) => p.url().includes('localhost:4200')) || pages[0];
  return { browser, context, page };
}
module.exports = { getPage };
```

**Không bao giờ gọi `browser.close()`** trên kết nối `connectOverCDP` — lệnh này đóng luôn cửa sổ Chrome thật, không phải chỉ ngắt kết nối. Cứ để script kết thúc (`process.exit(0)`) là đủ, CDP tự ngắt, cửa sổ vẫn còn sống cho script tiếp theo dùng lại.

## 6. Đăng nhập

Nhiều hệ thống Angular trong dự án này lưu token đăng nhập ở `sessionStorage` (không phải `localStorage`) — nghĩa là **không tái dùng được phiên đăng nhập** giữa các lần mở lại trình duyệt (kể cả dùng cùng `--user-data-dir`). Mỗi khi Chrome debug bị đóng (crash do hết RAM, người dùng lỡ tắt, restart máy...) phải nhờ người dùng đăng nhập lại thủ công 1 lần trên đúng cửa sổ đó.

Khi chờ đăng nhập, **không** coi "URL vừa đổi" là dấu hiệu đăng nhập xong — SPA tự redirect `/` → `/auth/login` ngay sau khi bootstrap, bản thân đó đã là 1 lần đổi URL và có thể khiến điều kiện chờ thoát sớm sai. Phải chờ URL **thực sự vào** `/auth/login` trước, sau đó mới chờ nó **rời khỏi** `/auth/login`:

```js
await page.goto('http://localhost:4200', { waitUntil: 'domcontentloaded' });
await page.waitForURL((url) => /\/auth\/login/i.test(url.pathname), { timeout: 30000 });
console.log('Da vao trang login, cho dang nhap thu cong...');
await page.waitForURL((url) => !/\/auth\/login/i.test(url.pathname), { timeout: 10 * 60 * 1000 });
```

## 7. Helper thao tác với các custom component (bọc DevExtreme)

Các dự án Angular trong repo này thường bọc DevExtreme (`dx-text-box`/`dx-select-box`/`dx-date-box`) trong component riêng (`app-custom-text-box`...), với layout: `<label>Nhãn:</label>` và control nằm chung 1 `<div>` cha gần nhất. Dùng XPath tìm theo nhãn:

```js
function fieldContainer(page, labelText) {
  return page.locator(
    'xpath=//label[contains(normalize-space(.), "' + labelText + '")]/ancestor::div[1]'
  );
}

async function fillText(page, labelText, value) {
  const input = fieldContainer(page, labelText).locator('input.dx-texteditor-input').first();
  await input.click();
  await input.fill('');
  await input.type(value, { delay: 15 });
  await page.keyboard.press('Tab');
}
```

**Lưu ý bắt buộc**: chọn `input.dx-texteditor-input` (chỉ đúng class này), **không** kết hợp thêm `, input` chung chung. `dx-select-box`/`dx-date-box` luôn render sẵn 1 `<input type="hidden">` đứng **trước** input thật trong DOM — nếu selector nhận cả `input` chung chung, `.first()` sẽ bắt nhầm input ẩn và mọi thao tác `click()/fill()/type()` sẽ âm thầm không có tác dụng (không báo lỗi, chỉ đơn giản là không nhập được).

Chọn dropdown (mở popup rồi click theo text):

```js
async function selectDropdown(page, labelText, optionText) {
  await fieldContainer(page, labelText).locator('.dx-selectbox, input').first().click();
  await page.waitForSelector('.dx-list-item', { timeout: 5000 });
  await page.locator('.dx-list-item').filter({ hasText: optionText }).first().click();
}
```

Click nút theo text — phải lọc `isVisible()` vì có thể có nhiều nút cùng text nằm ở tab/dialog đang ẩn cùng lúc (vd nút "Lưu" của tab đang ẩn và nút "Lưu" trong popup đang mở):

```js
async function clickButtonByText(page, text) {
  const candidates = page.locator('button, .custom-btn').filter({ hasText: text });
  const count = await candidates.count();
  for (let i = 0; i < count; i++) {
    if (await candidates.nth(i).isVisible()) { await candidates.nth(i).click(); return; }
  }
  throw new Error(`Khong tim thay button hien thi voi text: ${text}`);
}
```

Popup xác nhận dựng bằng `devextreme/ui/dialog` (`custom({...})`) render nút dạng `<div role="button" aria-label="Đồng ý">`, **không phải** thẻ `<button>` — không click theo tag/class được, phải dùng selector theo ARIA role:

```js
await page.getByRole('button', { name: 'Đồng ý' }).click();
```

## 8. Quy trình chạy

1. **Kiểm tra backend + frontend đang sống** trước mỗi lần chạy (và kiểm tra lại sau mỗi lần người dùng restart Visual Studio giữa chừng — rất hay xảy ra khi vừa nhập liệu vừa fix bug song song):
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4200
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5115/rlosv3api/api/<endpoint> -X POST -d "{}"
   ```
2. Mở Chrome debug (Mục 5) nếu chưa có, nhờ người dùng đăng nhập (Mục 6).
3. Viết **từng script nhỏ theo từng nghiệp vụ** (`create-agent.js`, `seed-courses.js`, `add-staff-to-course.js`...) thay vì 1 script khổng lồ làm hết — dễ debug lại từng bước khi selector sai.
4. Chạy thử với 1 bản ghi trước; nếu nghi ngờ kết quả, chụp screenshot bằng `page.screenshot({ path, fullPage: true })` để tự kiểm tra lại thay vì đoán qua log console.
5. Nếu gặp lỗi thật (toast lỗi, dữ liệu sai) — dừng lại, tái hiện lỗi qua `curl` trực tiếp vào API để đọc đúng message lỗi backend trả về (tránh đoán qua thông báo chung chung "0 Unknown Error"/"500 Error" của Angular), xác định root cause, sửa code, build lại, rồi mới chạy lại script.
6. Sau khi đã chạy ổn cho 1 bản ghi, lặp lại cho các bản ghi còn lại trong bộ testcase.
7. Dọn dữ liệu debug/test tạm qua đúng chức năng Xóa trên UI; dọn thư mục làm việc chỉ giữ lại các script dùng lại được (`connect.js`, `helpers.js`, các script `seed-*.js`), xóa screenshot/script vá lỗi một lần dùng.

## 9. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `connectOverCDP` timeout dù cổng 9222 vẫn phản hồi HTTP | Chrome bị treo ở tầng renderer (thường do máy hết RAM) | Kiểm tra RAM trống (`wmic OS get FreePhysicalMemory`); nếu quá thấp, chờ hồi phục hoặc nhờ người dùng đóng bớt ứng dụng trước khi thử lại — không thử lại mù quáng nhiều lần |
| Chọn dropdown/nhập text không có tác dụng, không báo lỗi | Selector bắt nhầm input ẩn của dx-select-box/date-box | Đổi selector về đúng `input.dx-texteditor-input` (xem Mục 7) |
| Click nút không có phản ứng | Có nhiều nút cùng text, nút thật đang ẩn dưới tab khác | Lọc `isVisible()` trước khi click (xem Mục 7) |
| Toast "Http failure response ... 0 Unknown Error" / "500 Error" | Backend (API Gateway) không phản hồi | Kiểm tra lại `curl` vào backend; nếu down, chờ người dùng khởi động lại rồi chụp/nhập lại toàn bộ các bước đã làm lúc backend down (dữ liệu/ảnh lúc đó không hợp lệ) |
| Ảnh chụp/dữ liệu nhập ra kết quả rỗng dù đã thao tác đúng | Thao tác thực hiện đúng lúc backend vừa down giữa chừng | Luôn xác nhận lại bằng `curl` gọi thẳng API sau khi nhập, không chỉ tin vào toast "thành công" trên UI |

## 10. Quality check trước khi báo hoàn tất

- [ ] Đã xác nhận backend + frontend sống trước khi chạy, và xác nhận lại sau mỗi lần gián đoạn.
- [ ] Dữ liệu đã nhập được xác minh lại qua API thật (không chỉ tin vào toast UI), đặc biệt các bản ghi tạo lúc gần thời điểm backend/frontend từng bị gián đoạn.
- [ ] Mọi bug thật phát hiện trong lúc chạy đã được sửa tận gốc, không né bằng cách đổi input.
- [ ] Dữ liệu debug/test tạm đã dọn qua đúng chức năng Xóa trên UI.
- [ ] Thư mục script chỉ còn lại các file dùng lại được, đã dọn screenshot/script vá lỗi một lần dùng.

## 11. Output format

Báo lại: danh sách dữ liệu đã tạo (kèm mã/id thật), danh sách bug thật phát hiện + đã fix trong lúc nhập liệu (nếu có), và ảnh minh họa đã chụp (nếu mục tiêu là phục vụ tài liệu HDSD — xem skill `gen-hdsd`).
