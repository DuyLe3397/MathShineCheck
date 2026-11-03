# Nghiên cứu: gửi thông báo cho học sinh khi bài được chấm hoặc có bình luận mới

> Ngày nghiên cứu: 2026-11-02. Mọi nguồn web dưới đây được truy cập ngày 2026-11-02, trừ khi ghi khác.
> Câu hỏi: khi giáo viên (hoặc skill chấm bài) chấm một Lần nộp, hoặc viết Nhận xét theo ảnh / trả lời thảo luận, hệ thống có gửi được thông báo về cho học sinh để em thấy ngay không? Có những cách nào, từ miễn phí đến trả phí?
> Bối cảnh: học sinh vào MathShine bằng cách bấm link trong Zalo. Lần đầu nhập thông tin đăng nhập, những lần sau bấm link là vào luôn.
>
> Quy ước: trích dẫn repo theo dạng `file:dòng`, đọc trên working copy ngày 2026-11-02 (nhánh `main`, sạch). Số liệu ghi "(tính)" là tôi tự tính từ bảng giá chính thức. Ý nào chưa có nguồn gốc kiểm chứng thì ghi **chưa xác minh**. Mức độ chắc chắn ghi là **cao / trung bình / thấp**. Tài liệu này chỉ là nghiên cứu: không sửa code, không đổi rule.

---

## 1. Tóm tắt và khuyến nghị

**Có làm được không?** Có, nhưng "thấy ngay" phụ thuộc vào kênh:

1. **Thông báo trong web (chuông, chấm đỏ)** làm được ngay, miễn phí, chạy cả khi học sinh mở link trong Zalo. Nhưng học sinh chỉ thấy **khi đang mở MathShine**. Đây là nền móng bắt buộc cho mọi kênh khác.
2. **Web Push** (thông báo hiện trên màn hình khóa điện thoại) miễn phí và hợp với stack hiện tại (Vercel `email-api` gửi được). Nhưng **không chạy trong trình duyệt nội bộ của Zalo**: Android WebView và WKWebView của iOS đều không hỗ trợ Push API (mức chắc chắn cao). Học sinh phải mở MathShine bằng Chrome trên Android, hoặc Safari rồi "Thêm vào Màn hình chính" trên iPhone (iOS 16.4 trở lên), rồi bấm "Cho phép".
3. **Tin nhắn Zalo** là kênh học sinh thấy nhanh nhất, nhưng mỗi cách đều có điều kiện:
   - **Zalo Bot** (bot.zaloplatforms.com): kênh chính thức, cá nhân từ 18 tuổi được tạo, có bản miễn phí. Học sinh phải nhắn cho bot trước một lần để liên kết. Giới hạn gửi và giá gói Premium **chưa xác minh** được (trang giá lỗi 500 lúc tra cứu).
   - **Zalo OA + tin Tư vấn**: muốn gửi tự động qua API thì OA phải **đã xác thực** (cần giấy đăng ký doanh nghiệp hoặc hộ kinh doanh) và mua **gói Tăng trưởng 2.500.000 đ/năm** trở lên. Qua OpenAPI chỉ gửi được trong **7 ngày** kể từ lần cuối học sinh tương tác với OA. Tin trong 48 giờ thì miễn phí, ngoài 48 giờ thì 55 đ/tin.
   - **ZNS (ZBS Template Message)**: gửi theo số điện thoại, học sinh không cần quan tâm OA. Giá **200 đ/tin** (chưa VAT). Cần OA đã xác thực, nạp tiền trước, mẫu tin được duyệt. Không hợp với giáo viên cá nhân chưa đăng ký kinh doanh.
4. **Không khuyến nghị:** thư viện tự động hóa tài khoản Zalo cá nhân như `zca-js` (README ghi rõ có thể bị khóa tài khoản), SMS brandname, Telegram, và bọc web thành app gốc (iOS mất 99 USD/năm).

**Khuyến nghị lộ trình** (chi tiết ở mục 5):

| Bước | Việc | Chi phí |
|---|---|---|
| 1 (làm ngay) | Thông báo trong web cho học sinh: ghi một bản ghi thông báo ở mọi chỗ chấm bài / bình luận, chuông + chấm đỏ ở thanh điều hướng học sinh | 0 đ |
| 2 | Web Push tự làm bằng thư viện `web-push` chạy trên Vercel `email-api`, kèm màn hình hướng dẫn "Mở bằng Chrome / Thêm vào Màn hình chính" khi phát hiện đang ở trong Zalo | 0 đ |
| 3 (thử với vài em) | Zalo Bot: học sinh nhắn mã liên kết cho bot, sau đó server gửi tin khi có điểm / bình luận | 0 đ nếu bản miễn phí đủ dùng (chưa xác minh) |
| 4 (chỉ khi cần chính thức, quy mô lớn) | OA đã xác thực + ZNS theo số điện thoại | khoảng 200 đ/tin + VAT; cần doanh nghiệp/hộ kinh doanh |

---

## 2. Phân tích dự án hiện tại

### 2.1. Stack

| Phần | Hiện trạng | Bằng chứng |
|---|---|---|
| Frontend | Angular 18 (standalone component), `@angular/fire` 18, Firebase JS SDK 12 | `package.json:15-35` |
| PWA / Service Worker | **Không có.** Không có `@angular/service-worker`, không có `manifest.webmanifest`, `index.html` không có `<link rel="manifest">`, `angular.json` không bật `serviceWorker` | `package.json:15-35`, `src/index.html:1-27`, grep `serviceWorker|manifest` trong `angular.json` không ra kết quả |
| Database | Cloud Firestore, bật `persistentLocalCache` (cache offline nhiều tab) | `src/app/app.config.ts:21-27` |
| Đọc dữ liệu | Toàn bộ là đọc một lần (`getDocs`/`getDoc`), **không có listener realtime** (`onSnapshot`, `collectionData`, `docData` đều không xuất hiện trong `src/app`) | grep trong `src/app` ra 0 kết quả |
| Hosting | Firebase Hosting, project `mathshine-check-274`, SPA rewrite về `index.html` | `firebase.json:2-24`, `.firebaserc:1-5` |
| Gói Firebase | Spark (miễn phí). ADR 0003 đã loại Cloud Functions vì phải lên Blaze và gắn thẻ | `docs/adr/0003-email-thong-bao-qua-vercel-gmail-smtp.md` |
| Backend | Không có backend riêng. Có một project Vercel nhỏ `email-api/` (Node 22): `api/notify.js` gửi Email thông báo cho giáo viên qua Gmail SMTP, `api/grading.js` là API cho skill chấm bài | `email-api/package.json:1-15`, `email-api/.vercel/project.json` (`mathshine-email-api`), `src/environments/environment.prod.ts:4` |
| Cách `email-api` đọc/ghi Firestore | Gọi REST **không xác thực**, dựa vào rule cho đọc/ghi công khai, không có service account | `email-api/lib/firestore.js:1-3`, `:33-44` |

### 2.2. Đăng nhập của học sinh và link Zalo

- Học sinh **không có tài khoản Firebase Auth**. Form đăng nhập hỏi Họ tên, SĐT, Lớp, Nhóm (`src/app/pages/auth/student-login.component.ts:128-188`). Hệ thống tìm document `students` khớp cả bốn trường (`src/app/services/auth.service.ts:157-168`, gọi ở `student-login.component.ts:241-268`).
- Khi khớp, toàn bộ document học sinh được lưu vào **`localStorage`** với khóa `mathshine_student` (`auth.service.ts:12`, `:117-128`). Lần sau mở app, constructor đọc lại khóa này và coi như đã đăng nhập (`auth.service.ts:28-42`). Không có token trong URL, không có cookie phiên.
- Vậy "bấm link Zalo là tự đăng nhập" thực chất là: link luôn mở trong **cùng một trình duyệt** (trình duyệt nội bộ của Zalo), trình duyệt đó còn giữ `localStorage`, nên em vào thẳng. Nếu em mở bằng Chrome hoặc Safari, hoặc cài lên Màn hình chính, thì đó là **kho lưu trữ khác** và em phải đăng nhập lại một lần.
  - Chrome Custom Tabs dùng chung cookie và quyền với Chrome, còn WebView thì "don't share state with the browser" ([Chrome Custom Tabs](https://developer.chrome.com/docs/android/custom-tabs)). Ứng dụng Zalo trên Android dùng WebView hay Custom Tabs thì **chưa xác minh** từ nguồn chính thức. Việc học sinh được tự đăng nhập lại trong Zalo cho thấy Zalo giữ lại kho lưu trữ giữa các lần mở, nhưng không cho biết là loại nào.
  - Trên iOS, mọi trình duyệt nội bộ đều chạy WKWebView.
- Code **không phát hiện** đang chạy trong Zalo (grep `zalo|userAgent|webview` trong `src/app` không ra kết quả).
- Theo một bài hướng dẫn (không chính thức), Zalo có tùy chọn để mọi link mở bằng trình duyệt mặc định của máy, và bài nói khi mở trong Zalo thì không dùng được các tính năng nâng cao của web ([Thế Giới Di Động](https://www.thegioididong.com/tin-tuc/cach-mo-link-tren-zalo-bang-chrome-1548614)). Tên và vị trí mục cài đặt trên bản Zalo hiện tại **chưa xác minh**. Tôi không tìm được trang hỗ trợ chính thức của Zalo về việc này.

### 2.3. Những gì đã có liên quan đến thông báo

| Thứ đã có | Mô tả | Vị trí |
|---|---|---|
| Thông báo cho **giáo viên** | Collection `teacherNotifications`, chuông ở sidebar giáo viên, nút Làm mới tải lại (commit 9042055) | `src/app/shared/components/teacher-notification-bell.component.ts`, `src/app/services/notification-refresh.service.ts:1-22`, ghi ở `firestore.service.ts:826-863` (Lần nộp mới), `:1108-1133` (bình luận) |
| Email thông báo cho **giáo viên** | Trình duyệt học sinh gọi `POST /api/notify` với `{kind, id}`; API đọc lại Firestore, đánh dấu `emailSentAt`, gửi qua Gmail SMTP tới hộp thư cố định `MAIL_TO` | `firestore.service.ts:813-824`, `email-api/api/notify.js:45-90`, `email-api/.env.example` |
| Chấm đỏ / số đếm cho **học sinh** | Thanh điều hướng học sinh đếm: yêu cầu xem bài đang chờ (Trang chủ), phản hồi yêu cầu (Bảng điểm), thảo luận mới (Thảo luận), so với mốc `lastHomeSeenAt`, `lastScoreboardSeenAt`, `lastDiscussionsSeenAt`. Chỉ tính **một lần khi tải trang** | `src/app/pages/student/student-navbar.component.ts:267-328`, `:192-216`; `src/app/services/student-notification.service.ts:1-27`; `models/index.ts:19-21` |
| Số bình luận chưa đọc trên từng Lần nộp | Trang chủ học sinh hiện "+N" cạnh Lần nộp có bình luận mới hơn `lastCommentSeenAt`; mở trang kết quả thì cập nhật mốc | `src/app/pages/student/home.component.ts:390-392`, `:694-717`; `src/app/pages/student/results.component.ts:836-840` |
| **Chưa có**: báo "bài đã được chấm" | Không có chấm đỏ hay thông báo nào cho sự kiện chấm điểm. Học sinh chỉ thấy điểm khi tự mở trang chủ | `home.component.ts:369` chỉ hiện điểm |
| Bộ khung thông báo học sinh **bỏ dở** | Model `AppNotification` có sẵn `type: 'graded' \| 'new_comment' \| 'new_reply' …` và hàm `getNotificationsByUser` đọc collection `notifications`, nhưng **không chỗ nào ghi hay gọi** | `src/app/models/index.ts:134-141`, `firestore.service.ts:1401-1411`, rule `firestore.rules:93-95` |
| Dữ liệu liên lạc của học sinh | Có `phone` (SĐT học sinh, giáo viên nhập; dùng để đăng nhập). **Không có** email, Zalo ID, hay đăng ký push | `models/index.ts:9-22`, `student-management.component.ts:481-530` |

### 2.4. Điểm gắn việc gửi thông báo

| Sự kiện | Chỗ xảy ra | Ghi chú |
|---|---|---|
| Giáo viên lưu điểm + Nhận xét chung | `src/app/pages/teacher/grading.component.ts:1514-1556` (`saveGrade`): gọi `createOrUpdateGrade` (`:1534`), đổi `status` sang `graded` (`:1536-1539`), `syncSubmissionsGraded` (`:1541-1545`) | Hàm dịch vụ: `firestore.service.ts:979-1012`. Chấm lại cũng đi qua đây, cần quyết định có báo lại không |
| Giáo viên viết Nhận xét theo ảnh | `grading.component.ts:1131-1158` (`sendComment`, `authorRole: 'teacher'` ở `:1147`) → `firestore.service.ts:1047-1064` (`addComment`) | `addComment` hiện chỉ gọi email-api khi người viết **không phải** giáo viên (`:1061`) |
| Skill `/cham-bai` đẩy bình luận | `email-api/api/grading.js:88-112` (`postComment`, tạo document ở `:110`) | Ghi thẳng từ server, **không đi qua Angular**, nên phải gắn thông báo ở server |
| Skill tải Ảnh đã chấm | `email-api/api/grading.js:114-126` (`uploadGraded`) | Có thể coi là "bài đã chấm" |
| Giáo viên trả lời thảo luận | `src/app/pages/teacher/discussions.component.ts:1334` → `firestore.service.ts:1300-1330` (`addReply`) | Chỉ cần nếu muốn báo cả thảo luận |
| Bạn khác bình luận vào bài của mình | `src/app/pages/student/results.component.ts:893` (`addComment`) | Cũng là "có người bình luận vào bài" |

### 2.5. Ràng buộc bảo mật cần lưu ý

- Rule hiện tại cho mọi người đọc/ghi `notifications`, `teacherNotifications`, `comments` (`firestore.rules:66-71`, `:93-99`). Học sinh không đăng nhập Firebase Auth nên rule không phân biệt được ai là ai.
- MDN lưu ý endpoint của đăng ký push "needs to be kept secret, or other applications might be able to send push messages to your application" ([MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)). Vậy **không được** lưu đăng ký push vào một collection đọc công khai. Cách hợp lý: collection mới với rule `allow read: if false`. Học sinh gửi đăng ký qua Vercel API, server đọc/ghi bằng service account. Hiện `email-api` chưa có service account (`email-api/lib/firestore.js:1-3`), phải thêm.
- Chat ID của Zalo Bot, UID của OA và số điện thoại cũng nên lưu như vậy.

---

## 3. Các phương án

### 3.1. Thông báo trong web (in-app)

**Cách hoạt động.** Ở mỗi điểm trong mục 2.4, ghi một document `studentNotifications` (hoặc dùng lại `notifications` và `AppNotification` đã có) gồm `studentId`, `type` (`graded`, `comment`, `reply`), `submissionId`, `createdAt`, `isRead`. Thanh điều hướng học sinh hiện chuông và số chưa đọc, bấm vào thì mở đúng Lần nộp, giống chuông giáo viên.

- **Realtime khi đang mở:** dùng `onSnapshot` thay cho `getDocs` trên truy vấn `studentId == uid && isRead == false`. Firestore tính "a read each time a document in the result set is added or updated". Với cache offline đang bật, mất kết nối quá 30 phút thì tính như một truy vấn mới ([Firestore pricing](https://firebase.google.com/docs/firestore/pricing)).
- **Hạn mức Spark:** 50.000 lượt đọc, 20.000 lượt ghi mỗi ngày ([Firebase pricing](https://firebase.google.com/pricing)). Một thông báo tốn khoảng 1 lượt ghi và vài lượt đọc, nên với vài trăm học sinh là rất dư (tính).

| Tiêu chí | Đánh giá |
|---|---|
| Học sinh cần làm gì | Không gì cả |
| Chạy khi mở link trong Zalo | **Có**, vì chỉ là trang web |
| Thấy ngay? | Chỉ khi đang mở MathShine. Đóng app thì phải chờ lần mở sau |
| Chi phí | 0 đ, trong hạn mức Spark |
| Độ khó | Thấp: làm theo đúng mẫu `teacherNotifications`. Riêng `postComment` của skill thì ghi từ server |
| Rủi ro | Rule công khai: ai cũng đọc được thông báo của người khác (cùng mức rủi ro với dữ liệu hiện có) |

Đây là **nền móng**: Web Push và Zalo đều cần một bản ghi sự kiện và link "mở đúng chỗ". Khi bấm từ push hay tin Zalo, học sinh vẫn phải vào web xem.

### 3.2. Web Push (Push API + Service Worker + VAPID)

**Cách hoạt động** ([web.dev](https://web.dev/articles/push-notifications-overview)):
1. Học sinh bấm nút "Bật thông báo", trang gọi `Notification.requestPermission()`.
2. Trang đăng ký push bằng khóa VAPID công khai, nhận `PushSubscription` (endpoint + khóa mã hóa) và gửi về server lưu lại.
3. Khi có sự kiện, server ký bằng khóa VAPID bí mật, mã hóa nội dung rồi gửi tới **push service của trình duyệt**. "Your server doesn't actually send the push message directly to a client. A push service does that." Vì vậy **bắt buộc có server**. Ở dự án này, server là Vercel `email-api`.
4. Service worker trên máy học sinh được đánh thức, nhận sự kiện `push` và hiện thông báo.

Angular có sẵn `@angular/service-worker`: `SwPush` hiện thông báo, và `onActionClick` với `navigateLastFocusedOrOpen` mở đúng URL khi bấm ([Angular push](https://angular.dev/ecosystem/service-workers/push-notifications)).

**Điều kiện theo nền tảng** (mức chắc chắn cao, dữ liệu tương thích của MDN):

| Môi trường | Push API | Nguồn |
|---|---|---|
| Chrome Android (tab thường, không cần cài) | Có | [MDN BCD PushManager](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/PushManager.json): `chrome_android` = mirror (theo Chrome desktop) |
| Samsung Internet | Có | như trên |
| **Android WebView** (trình duyệt nội bộ của nhiều app) | **Không** | như trên: `webview_android` = `false` |
| Safari iOS | Từ 16.4, **chỉ khi web đã thêm vào Màn hình chính** | như trên: `safari_ios` = "16.4", ghi chú "Notifications are supported in web apps saved to the home screen." |
| **WKWebView iOS** (trình duyệt nội bộ của Zalo trên iPhone) | **Không** | như trên: `webview_ios` = `false` |

WebKit nói rõ điều kiện trên iOS/iPadOS 16.4 ([WebKit blog](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)):
- "A web app that has been added to the Home Screen can request permission to receive push notifications".
- Manifest phải có `display` là `standalone` hoặc `fullscreen`. Không có thì chỉ là một bookmark.
- Yêu cầu cấp quyền phải xuất phát từ thao tác trực tiếp của người dùng (bấm nút).
- Trình duyệt bên thứ ba trên iOS chỉ thêm được vào Màn hình chính khi có entitlement trình duyệt. Zalo không phải trình duyệt, nên học sinh iPhone phải **mở bằng Safari** rồi Chia sẻ → Thêm vào Màn hình chính.

**Có chạy trong trình duyệt nội bộ của Zalo không?**
- **iPhone:** **Không** (mức chắc chắn cao). Zalo phải dùng WKWebView, mà WKWebView không có Push API.
- **Android:** nếu Zalo dùng WebView thì **không** (mức chắc chắn cao theo MDN). Nếu Zalo mở link bằng Chrome Custom Tabs thì có thể chạy, vì Custom Tabs "supports whatever the user's browser supports" ([Custom Tabs](https://developer.chrome.com/docs/android/custom-tabs)). Zalo dùng loại nào thì **chưa xác minh**. Cần thử trên máy thật: mở link trong Zalo rồi kiểm tra `'serviceWorker' in navigator && 'PushManager' in window`.
- Kết luận thực tế: phải có một bước **đưa học sinh ra khỏi Zalo một lần**. Trang có thể phát hiện đang ở trong Zalo bằng cách kiểm tra tính năng như trên. Việc user-agent của Zalo có chứa chữ "Zalo" hay không thì **chưa xác minh**. Khi phát hiện, trang hiện hướng dẫn: Android "Mở bằng Chrome", iPhone "Mở bằng Safari → Thêm vào Màn hình chính". Sau đó em đăng nhập lại một lần trong trình duyệt hoặc app mới (mục 2.2) và bấm "Bật thông báo".
- Hệ quả phụ: em vẫn có thể bấm link Zalo như cũ để vào web. Thông báo push thì hiện qua Chrome hoặc app trên Màn hình chính. Bấm thông báo sẽ mở Chrome hoặc app, không mở Zalo.

**Ba cách triển khai:**

| | Tự làm bằng `web-push` | Firebase Cloud Messaging (FCM) | OneSignal |
|---|---|---|---|
| Là gì | Thư viện Node gửi theo Web Push Protocol, sinh khóa VAPID bằng `generateVAPIDKeys()`, gửi bằng `sendNotification(subscription, payload)` ([web-push](https://github.com/web-push-libs/web-push)) | SDK web của Firebase. Cần file `firebase-messaging-sw.js` ở gốc domain và khóa VAPID tạo trong console. API `getToken()` đã bị đánh dấu deprecated, khuyến nghị dùng Installation ID ([FCM JS client](https://firebase.google.com/docs/cloud-messaging/js/client)) | Dịch vụ push trọn gói có dashboard |
| Chi phí | 0 đ (Vercel Hobby có sẵn 1.000.000 lượt gọi function/tháng ([Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines))) | 0 đ: FCM nằm trong nhóm "No-cost Products" của cả gói Spark ([Firebase pricing](https://firebase.google.com/pricing)) | Gói Free: web push tối đa 10.000 subscriber mỗi lần gửi. Gói Growth từ 19 USD/tháng cộng 0,004 USD mỗi web push subscriber ([OneSignal pricing](https://onesignal.com/pricing)) |
| Server gửi | Vercel `email-api` | Vẫn cần server: HTTP v1 API ủy quyền bằng service account hoặc OAuth token, **không bắt buộc Cloud Functions** ([FCM HTTP v1](https://firebase.google.com/docs/cloud-messaging/send/v1-api)) | Gọi REST API của OneSignal từ Vercel |
| Hợp với stack | Tốt nhất: ít phụ thuộc, dùng chung service worker của Angular (`SwPush`) | Được, nhưng phải gộp `firebase-messaging-sw.js` với service worker của Angular, thêm một lớp token | Được, nhưng thêm SDK bên thứ ba và đưa dữ liệu học sinh ra ngoài |
| Giới hạn | Firefox có hạn ngạch push không hiện thông báo; "In Chrome there are no limits" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)) | Như Web Push | Như Web Push |

**Đánh giá chung Web Push:**

| Tiêu chí | Đánh giá |
|---|---|
| Học sinh cần làm gì | Mở bằng Chrome (Android) hoặc Safari → Thêm vào Màn hình chính (iPhone 16.4+), đăng nhập lại một lần, bấm "Cho phép thông báo" |
| Chạy khi chỉ mở link trong Zalo | **Không** (iPhone chắc chắn không; Android gần như chắc chắn không, cần thử) |
| Chi phí | 0 đ |
| Độ khó | Trung bình: thêm `@angular/service-worker` + manifest (`display: standalone`), màn hình hướng dẫn, endpoint `subscribe` và `push` trên Vercel, service account cho collection kín |
| Rủi ro | Nhiều em sẽ bỏ qua bước cài đặt. Điện thoại có thể là máy của phụ huynh. iOS cũ hơn 16.4 không dùng được. Vercel Hobby "restricted to non-commercial personal use only" ([Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines)), nếu lớp học thu phí thì cần cân nhắc (rủi ro này đã có với `email-api` hiện tại) |

### 3.3. Zalo Official Account (OA): tin Tư vấn

Nguồn chính: trang hướng dẫn của Zalo OA ([Tin Tư vấn](https://oa.zalo.me/home/documents/guides/tin-tu-van), [Tổng quan các loại tin](https://oa.zalo.me/home/documents/guides/tong-quan-cac-loai-tin-nhan-tren-zalo-official-account-_3651713298729094511)) và bảng giá ([Bảng giá OA](https://zalo.solutions/oa/pricing)). Trang tài liệu API tại developers.zalo.me được dựng bằng JavaScript. WebFetch chỉ đọc được tiêu đề, còn Chrome thì không kết nối được, nên tôi **không đọc được** phần API chi tiết ở đó.

**Quy định gửi tin Tư vấn** (mức chắc chắn cao, trích trang chính thức):
- "Tin Tư vấn gửi trong khung 48 giờ kể từ tương tác cuối của người dùng hoàn toàn miễn phí." Ngoài khung thì tính theo bảng giá.
- Thời hạn được gửi phụ thuộc công cụ:
  - qua OA Manager (giáo viên gửi tay): trong vòng **365 ngày** kể từ tương tác cuối;
  - qua **OpenAPI** (server tự gửi): chỉ trong vòng **07 ngày**.
- Tương tác được tính gồm:
  - nhắn tin cho OA;
  - chat trong nhóm GMF;
  - gọi hoặc nghe máy cuộc gọi từ OA;
  - bình luận bài viết;
  - tương tác với Chatbot;
  - bấm Menu hoặc CTA, bấm Widget OA.
- Chỉ "Quan tâm OA" hoặc bấm "Nhắn tin" trên trang OA thì OA chỉ được gửi **một lời chào**. Điều kiện gửi: "Người dùng có phát sinh tương tác với OA và đang không chặn OA."
- Tin Broadcast chỉ gửi cho người đang quan tâm OA, trong khung 6:00–19:59, theo hạn mức của gói.
- Thông báo cũ hơn (đăng 15/01/2024, áp dụng từ 20/06/2023) ghi "Miễn phí 08 tin đầu tiên gửi trong 48 giờ…" và 55 đ cho mỗi tin tiếp theo ([Chính sách gửi tin](https://oa.zalo.me/home/resources/news/thong-bao-chinh-sach-gui-tin-va-quy-dinh-phi-gui-tin_1433049880779375099)). Trang hướng dẫn hiện tại nói "hoàn toàn miễn phí" trong 48 giờ, không nhắc giới hạn 8 tin. Hai trang **không khớp nhau**, cần hỏi lại Zalo nếu đi theo hướng này.

**Gói OA** ([Bảng giá OA](https://zalo.solutions/oa/pricing), giá đã gồm VAT; số liệu theo cột do công cụ trích từ bảng nên mức chắc chắn trung bình):

| Gói | Giá | Tin Tư vấn ngoài khung 48h có sẵn/tháng | Tích hợp API |
|---|---|---|---|
| Cơ bản (mặc định) | Không ghi giá | Không | Không |
| Tiêu chuẩn | 1.000.000 đ/năm | Không | Không |
| Tăng trưởng | 2.500.000 đ/năm (hoặc 1.400.000 đ/6 tháng) | 500 | Có, 100 request/phút |
| Toàn diện | 6.000.000 đ/năm (hoặc 3.400.000 đ/6 tháng) | 2.000 | Có, 2.000 request/phút |

- Trang ghi "Dành cho OA đã xác thực" và "Để liên kết ứng dụng với OA thông qua API, bạn cần sử dụng Gói tăng trưởng hoặc toàn diện." Hết hạn mức thì 55 đ/tin.
- Trang tin tức OA có bài "Quyền lợi và biểu phí các gói dịch vụ Zalo OA mới từ 1/6/2026", nhưng tôi không mở được bài này, nên **chưa đối chiếu** được với bảng trên.

**Xác thực OA.** Hướng dẫn chính thức có 3 cách xác thực "tài khoản Zalo OA Doanh nghiệp": theo tên doanh nghiệp/hộ kinh doanh, theo nhãn hiệu đã đăng ký, hoặc theo tên khác/ngành nghề có điều kiện. Không thấy cách nào cho **cá nhân không đăng ký kinh doanh** ([Hướng dẫn xác thực](https://oa.zalo.me/home/documents/guides/huong-dan-xac-thuc_70)). OA phải nộp hồ sơ xác thực trong 14 ngày kể từ khi tạo. Nếu bị từ chối mà không nộp lại trong 14 ngày thì tài khoản bị khóa vĩnh viễn ([Chính sách đăng ký OA doanh nghiệp](https://oa.zalo.me/home/documents/policy/dang-ky-va-su-dung-tai-khoan-zalo-official-account-doanh-nghiep)).

**Áp vào MathShine:**
- Học sinh phải nhắn cho OA (ví dụ gửi mã liên kết) để server biết UID của em và nối với document `students`.
- Sau đó mỗi khi có điểm hay bình luận, server gửi tin Tư vấn kèm link. Nếu em không tương tác với OA quá 7 ngày thì OpenAPI **không gửi được nữa**, cho tới khi em tương tác lại.
- Việc bấm nút/link trong chính tin Tư vấn có được tính là "bấm CTA" để làm mới khung hay không thì **chưa xác minh**.

| Tiêu chí | Đánh giá |
|---|---|
| Học sinh cần làm gì | Quan tâm OA, nhắn mã liên kết, thỉnh thoảng tương tác lại |
| Chạy khi chỉ mở link trong Zalo | **Có**, tin hiện ngay trong Zalo |
| Chi phí | Tối thiểu 2.500.000 đ/năm (gói Tăng trưởng để có API) + xác thực OA. Tin trong 48h miễn phí, ngoài khung dùng hạn mức 500 tin/tháng, sau đó 55 đ/tin |
| Độ khó | Trung bình–cao: OAuth của Zalo cho OA, webhook nhận tin, lưu UID kín, xử lý khung 7 ngày |
| Rủi ro | Giáo viên cá nhân không xác thực được OA. Chính sách đổi thường xuyên (hai trang lệch nhau về "8 tin") |

### 3.4. ZNS / ZBS Template Message (gửi theo số điện thoại)

Nguồn: [ZNS](https://zalo.solutions/zns), [Bảng giá ZNS](https://zalo.solutions/zns/pricing) (zalo.cloud đã chuyển sang zalo.solutions), [Hướng dẫn ZBS](https://zalo.solutions/business-message/guidelines/intro), [Liên kết OA vào ZBS](https://zalo.solutions/business-message/guidelines/huong-dan-lien-ket-zalo-oa-vao-tai-khoan-zbs-va-uy-quyen-cho-ung-dung-appid), [Quy định kiểm duyệt mẫu](https://zalo.solutions/business-message/guidelines/quy-dinh-chung-khi-kiem-duyet-mau-zbs-template-message).

- **Cách hoạt động:**
  - Gửi một mẫu tin đã được duyệt tới người "có số điện thoại đang sử dụng Zalo", "không yêu cầu điều kiện follow OA trước đó".
  - Gửi tự động được qua API.
  - Hệ thống chỉ tính tiền tin đã đến máy người nhận.
- **Điều kiện:**
  - Phải có 3 tài khoản liên kết: tài khoản ZBS, Zalo OA, AppID.
  - "Chỉ OA đã xác thực mới liên kết được vào tài khoản ZBS".
  - Phải nạp tiền trước vào tài khoản ZBS.
  - Hạn mức tin mỗi ngày tăng dần theo chất lượng gửi. Con số khởi điểm **chưa xác minh** từ trang chính thức.
- **Nội dung:**
  - Mẫu "Thông báo tình hình học tập" thuộc **Tag 2 – Chăm sóc khách hàng**, nên mẫu "Bài của em đã được chấm" có khả năng phù hợp (suy luận từ danh mục, chưa được Zalo xác nhận).
  - Trong thân tin không được có link hay số điện thoại; link phải đặt ở nút CTA.
  - Chỉ gửi cho người dùng "đã phát sinh giao dịch với doanh nghiệp".
  - Trang không nêu thời gian duyệt mẫu.
- **Giá** (chưa VAT; mức chắc chắn cao tại ngày tra cứu):
  - mẫu thường **200 đ/tin**; mẫu xác thực, yêu cầu chuyển khoản, voucher 300 đ/tin;
  - nút đầu tiên miễn phí, mỗi nút thêm 100 đ;
  - gửi theo UID được trợ giá ít hơn gửi theo số điện thoại.
- **Ước tính** (tính): 100 học sinh × khoảng 25 thông báo/tháng = 2.500 tin × 200 đ = **500.000 đ/tháng** + VAT. Có thể giảm bằng cách gộp: mỗi ngày gửi tối đa một tin cho mỗi em.
- **Hợp với giáo viên cá nhân?** **Không**, trừ khi giáo viên hoặc trung tâm có đăng ký hộ kinh doanh/doanh nghiệp để xác thực OA (mục 3.3).
- Dữ liệu sẵn có: `students.phone` là SĐT **học sinh** (nhãn form ở `student-login.component.ts:143`). Số này phải là số đang dùng Zalo. Nếu em dùng Zalo của phụ huynh thì tin đến máy phụ huynh.

| Tiêu chí | Đánh giá |
|---|---|
| Học sinh cần làm gì | Không gì (miễn là SĐT đúng và có Zalo) |
| Chạy khi chỉ mở link trong Zalo | **Có**, tin hiện trong Zalo |
| Chi phí | Khoảng 200 đ/tin + VAT, nạp trước; cộng chi phí xác thực/gói OA nếu có |
| Độ khó | Trung bình: API ZBS, OAuth AppID, thủ tục duyệt mẫu |
| Rủi ro | Cần pháp nhân. Hạn mức đầu thấp. Mẫu có thể bị từ chối. Gửi theo SĐT mà không có đồng ý rõ ràng có thể vướng quy định dữ liệu cá nhân (nên hỏi ý phụ huynh/học sinh) |

### 3.5. Zalo Mini App

Mini App là ứng dụng chạy bên trong Zalo. Tôi **không tìm được** tài liệu chính thức nào cho thấy Mini App có kênh push riêng. Các nguồn tìm được chỉ nói ZNS có thể dẫn người nhận vào Mini App, và giá nút dẫn vào Mini App của đối tác giống nút dẫn vào OA (nguồn bên thứ ba: [nhanh.vn](https://pos.manual.nhanh.vn/pos/cai-dat/gui-zalo-zns/cac-loai-tin-cua-oa)). Nghĩa là Mini App **không giải quyết** việc gửi thông báo, mà vẫn phải dựa vào OA/ZNS. Ngoài ra phải viết lại giao diện theo khung Mini App và qua duyệt. Mức chắc chắn: thấp–trung bình. Không khuyến nghị cho mục tiêu này.

### 3.6. Zalo Bot (chính thức) và các giải pháp không chính thức

**Zalo Bot Platform** ([Tài liệu](https://bot.zaloplatforms.com/docs/), [Tạo bot](https://bot.zaloplatforms.com/docs/create-bot/), [sendMessage](https://bot.zaloplatforms.com/docs/apis/sendMessage/), [Webhook](https://bot.zaloplatforms.com/docs/webhook/), [Điều khoản](https://bot.zaloplatforms.com/docs/terms/), [Mã lỗi](https://bot.zaloplatforms.com/docs/error-code/)):
- **Định nghĩa:** "một tài khoản tự động (bot) hoạt động trên nền tảng Zalo", dùng để nhắn tin tự động với người dùng trong cửa sổ chat.
- **Cách tạo:** trong app Zalo, tìm OA **Zalo Bot Manager**, chọn "Tạo bot". Tên bot bắt buộc bắt đầu bằng "Bot", ví dụ "Bot MathShine". Hệ thống gửi Bot Token về tài khoản Zalo của người tạo.
- **Ai được tạo:** điều khoản ghi "Zalo Bot chỉ được cung cấp cho Nhà phát triển là cá nhân từ đủ mười tám (18) tuổi trở lên". Nghĩa là **giáo viên cá nhân dùng được**, không cần pháp nhân như OA.
- **API kiểu Telegram:**
  - `POST https://bot-api.zaloplatforms.com/bot<TOKEN>/sendMessage` với `chat_id` và `text` (1–2000 ký tự), có `parse_mode` markdown/html;
  - nhận tin bằng `getUpdates` hoặc `setWebhook`; webhook phải dùng HTTPS và có secret.
  - Payload webhook có `chat.id` ("Sử dụng chat.id để gửi tin nhắn phản hồi tới cuộc trò chuyện") và `from.id`.
- **Phí:** điều khoản nói có bản miễn phí và bản Premium trả theo kỳ. Số bot quản lý được tùy gói. Có mã lỗi 429 "Quota exceeded". **Giá gói và hạn mức cụ thể chưa xác minh**: trang `/pricing/` trả lỗi 500 lúc tra cứu, các trang tài liệu không ghi con số.
- **Gửi chủ động:** tài liệu `sendMessage` không nói có khung thời gian sau tương tác hay không (**chưa xác minh**). `chat_id` chỉ có được từ tin học sinh gửi tới bot, nên học sinh **phải nhắn cho bot trước** (suy luận từ tài liệu webhook).
- **Nghĩa vụ của nhà phát triển:** phải báo cho người dùng biết họ đang nói chuyện với phần mềm tự động, và không được xử lý dữ liệu cá nhân trái phép.
- **Áp vào MathShine:**
  1. Trang Hồ sơ học sinh hiện nút "Nhận thông báo qua Zalo" kèm một mã ngắn.
  2. Em bấm link mở chat với bot và gửi mã.
  3. Webhook trên Vercel nối `chat.id` với `studentId`, lưu kín.
  4. Khi có điểm hay bình luận, server gọi `sendMessage` kèm link Kết quả.

  Học sinh làm cả bước này **ngay trong Zalo**, không cần rời Zalo. Bấm link trong tin bot thì mở bằng trình duyệt nội bộ của Zalo như hiện nay, nên vẫn tự đăng nhập.
- **Rủi ro:**
  - Nền tảng mới, chưa rõ hạn mức và giá.
  - Zalo có thể tạm dừng tài khoản "theo quyết định riêng của mình và không cần thông báo trước".
  - Không có bảo đảm độ tin cậy.
  - Vì vậy nên coi đây là kênh **bổ sung** cho thông báo trong web, không phải kênh duy nhất.

**Không chính thức: `zca-js` và các thư viện tương tự.** Đây là "Unofficial Zalo API for JavaScript", giả lập phiên Zalo Web của **tài khoản cá nhân**. README ghi "Using this API could get your account locked or banned" và "Use it at your own risk" ([zca-js](https://github.com/RFS-ADRENO/zca-js)). Các bài báo thuật lại điều khoản Zalo cho biết người dùng không được đăng nhập qua phần mềm bên thứ ba không được Zalo chấp thuận, và tài khoản có thể bị khóa khi gửi tin hàng loạt ([VOH](https://voh.com.vn/cong-nghe/tai-khoan-zalo-bi-khoa-nguyen-nhan-va-cach-khac-phuc-333327.html)). Trang điều khoản gốc của Zalo dựng bằng JS nên tôi không đọc được (**chưa xác minh** nguyên văn). **Không khuyến nghị**: nếu bị khóa thì mất luôn tài khoản Zalo giáo viên dùng để liên lạc với cả lớp.

### 3.7. Email và SMS

**Email:**
- Dự án đã có sẵn đường gửi Gmail SMTP qua Vercel. ADR 0003 ghi khoảng 500 thư/ngày (`docs/adr/0003-email-thong-bao-qua-vercel-gmail-smtp.md`).
- Nếu cần dịch vụ riêng: Resend gói Free có 3.000 thư/tháng, giới hạn 100 thư/ngày; gói Pro 20 USD/tháng cho 50.000 thư ([Resend pricing](https://resend.com/pricing)).
- Trang giá và trang trợ giúp của Brevo không đọc được lúc tra cứu (403), nên không ghi số.
- Hạn chế lớn: hệ thống **chưa lưu email học sinh** (`models/index.ts:9-22`), và học sinh hiếm khi đọc email. Kênh này chỉ hợp để gửi **phụ huynh** bản tổng hợp tuần.

**SMS brandname:**
- Phải đăng ký thương hiệu với nhà mạng, và brandname quảng cáo khác brandname chăm sóc khách hàng.
- Tôi không tìm được bảng giá brandname chăm sóc khách hàng chính thức của nhà mạng cho năm 2026. Giá SMS thường của cá nhân khoảng 200–350 đ/tin theo các bài tổng hợp ([CellphoneS](https://cellphones.com.vn/sforum/1-tin-nhan-sms-bao-nhieu-tien)), mức chắc chắn thấp.
- Đắt hơn ZNS, thủ tục nặng hơn, nội dung không có link đẹp. **Không khuyến nghị.**

### 3.8. Telegram bot

- Bot Telegram nhắn miễn phí: "By default, bots are able to message their users at no cost". Giới hạn khoảng 30 tin/giây khi gửi cho nhiều người ([Bots FAQ](https://core.telegram.org/bots/faq)).
- "Bots can't start conversations with users" ([Telegram Bots](https://core.telegram.org/bots)): học sinh phải cài Telegram và nhắn cho bot trước.
- Về kỹ thuật giống Zalo Bot, nhưng học sinh Việt Nam chủ yếu dùng Zalo. Chỉ nên cân nhắc nếu Zalo Bot không dùng được.

### 3.9. Bọc web thành app di động (Capacitor / Trusted Web Activity)

- **Android:**
  - TWA mở PWA bên trong một app Android, nội dung chạy bằng trình duyệt của máy ([TWA](https://developer.chrome.com/docs/android/trusted-web-activity)). Trang tài liệu này không nói gì về push.
  - Capacitor cho push gốc qua FCM.
  - Google Play thu 25 USD một lần. Tài khoản cá nhân mới phải đáp ứng yêu cầu thử nghiệm và xác minh thiết bị trước khi phát hành ([Play Console](https://support.google.com/googleplay/android-developer/answer/6112435)).
- **iOS:** Apple Developer Program 99 USD/năm, cá nhân được đăng ký ([Apple enrollment](https://developer.apple.com/support/enrollment/)). Còn phải qua duyệt App Store, và một app chỉ bọc trang web có thể bị từ chối (**chưa xác minh** cho trường hợp này).
- **Đánh giá:** học sinh phải cài app, tức là thêm một bước khó hơn cả "Thêm vào Màn hình chính". Còn phải bảo trì hai bản app. Lợi ích so với Web Push chủ yếu là chạy được trên iOS cũ và thông báo ổn định hơn. **Không đáng** ở quy mô một lớp học thêm.

---

## 4. Bảng so sánh tổng hợp (miễn phí → trả phí)

| # | Phương án | Học sinh cần làm | Chạy khi chỉ mở link trong Zalo | Thấy khi đóng app | Chi phí | Độ khó với stack hiện tại | Rủi ro chính | Chắc chắn |
|---|---|---|---|---|---|---|---|---|
| 1 | Thông báo trong web (chuông, chấm đỏ, realtime khi mở) | Không | Có | Không | 0 đ | Thấp | Chỉ thấy khi mở web | Cao |
| 2 | Web Push tự làm (`web-push` + Vercel) | Mở bằng Chrome / Safari + Thêm vào MH chính, đăng nhập lại, bấm Cho phép | **Không** | Có | 0 đ | Trung bình | Nhiều em không cài; iOS < 16.4 không được | Cao |
| 3 | Web Push qua FCM | Như 2 | Không | Có | 0 đ | Trung bình (thêm service account, gộp service worker) | Như 2 | Cao |
| 4 | Web Push qua OneSignal | Như 2 | Không | Có | 0 đ tới 10.000 subscriber/lần gửi; Growth 19 USD/tháng + 0,004 USD/subscriber | Trung bình | Dữ liệu ra bên thứ ba | Cao |
| 5 | Zalo Bot | Nhắn mã liên kết cho bot một lần | Có | Có (tin Zalo) | 0 đ bản miễn phí; Premium chưa rõ giá | Trung bình | Hạn mức/giá chưa công bố; nền tảng mới | Trung bình–thấp |
| 6 | Email (Gmail SMTP có sẵn / Resend) | Cung cấp email | Có | Có (nếu đọc mail) | 0 đ (Resend free 100 thư/ngày) | Thấp | Học sinh ít đọc mail; chưa lưu email | Cao |
| 7 | Telegram bot | Cài Telegram, nhắn bot | Có | Có | 0 đ | Trung bình | Học sinh ít dùng Telegram | Cao |
| 8 | Zalo OA + tin Tư vấn qua API | Quan tâm OA, nhắn mã, tương tác lại trong 7 ngày | Có | Có | Từ 2.500.000 đ/năm (gói Tăng trưởng) + xác thực; ngoài 48h dùng hạn mức rồi 55 đ/tin | Trung bình–cao | Cần pháp nhân; khung 7 ngày; chính sách hay đổi | Trung bình |
| 9 | ZNS theo số điện thoại | Không (SĐT có Zalo) | Có | Có | 200 đ/tin + VAT (tính: khoảng 500.000 đ/tháng cho 100 em) | Trung bình | Cần OA xác thực, nạp trước, duyệt mẫu | Cao về giá, trung bình về điều kiện |
| 10 | SMS brandname | Không | Có (SMS) | Có | Vài trăm đ/tin + phí brandname (chưa có bảng giá chính thức) | Trung bình | Thủ tục nhà mạng | Thấp |
| 11 | App gốc (Capacitor/TWA) | Cài app | Không | Có | 25 USD một lần (Play) + 99 USD/năm (Apple) | Cao | Duyệt store, bảo trì hai bản | Cao về phí |
| ✗ | `zca-js` (tự động hóa Zalo cá nhân) | Không | Có | Có | 0 đ | Trung bình | **Khóa tài khoản Zalo giáo viên**, vi phạm điều khoản | Cao về rủi ro |

---

## 5. Khuyến nghị lộ trình cho MathShine

**Bước 1 – Thông báo trong web cho học sinh (làm ngay, 0 đ).**
- Thêm collection `studentNotifications` (hoặc dùng lại `notifications`/`AppNotification` đang bỏ dở ở `models/index.ts:134-141`).
- Ghi thông báo ở:
  - `saveGrade` (`grading.component.ts:1514`);
  - `addComment` khi người viết là giáo viên hoặc bạn khác (`firestore.service.ts:1047`);
  - `postComment` của skill (`email-api/api/grading.js:88`);
  - tùy chọn `addReply` của giáo viên.
- Hiện chuông + số chưa đọc ở `student-navbar.component.ts`, thêm nhãn "Mới chấm" cạnh Lần nộp ở trang chủ.
- Dùng `onSnapshot` cho truy vấn thông báo chưa đọc để thấy ngay khi đang mở web.
- Đây cũng là nguồn sự kiện duy nhất cho các bước sau: mỗi document thông báo có cờ kiểu `pushSentAt` / `zaloSentAt`, chống gửi trùng như `emailSentAt` hiện nay (`email-api/api/notify.js:60-66`).

**Bước 2 – Web Push miễn phí, kèm hướng dẫn rời Zalo một lần.**
- Thêm `@angular/service-worker` và manifest (`display: standalone`, icon).
- Thêm trang "Bật thông báo" trong Hồ sơ học sinh:
  - Nếu không có `PushManager`, nhiều khả năng đang ở trong Zalo. Hiện hướng dẫn mở bằng Chrome (Android) hoặc Safari → Thêm vào Màn hình chính (iPhone).
  - Nếu có thì hiện nút "Cho phép thông báo".
- Thêm hai endpoint trên `email-api`:
  - `POST /api/push/subscribe` lưu đăng ký vào collection **kín** (rule `allow read, write: if false`, server dùng service account);
  - `POST /api/push/send` (hoặc gộp vào `/api/notify`) gửi bằng thư viện `web-push`.
- Khi giáo viên chấm, trình duyệt giáo viên gọi API kèm Firebase ID token để server xác minh người gọi là giáo viên. Với `postComment`, server tự gửi luôn.
- Ước lượng: chỉ một phần học sinh sẽ bật (nhất là iPhone). Vì vậy giữ Bước 1 làm chỗ dựa.

**Bước 3 – Thử Zalo Bot với 3–5 học sinh (0 đ nếu bản miễn phí đủ).**
- Giáo viên tạo "Bot MathShine" qua OA Zalo Bot Manager.
- Webhook trên Vercel nhận mã liên kết, lưu `chat.id` kín.
- Server gửi `sendMessage` khi có thông báo mới, kèm link `/student/results/<submissionId>`. Bấm link trong Zalo sẽ mở đúng trình duyệt nội bộ đang giữ đăng nhập.
- Trước khi mở rộng, kiểm tra trên thực tế:
  1. hạn mức tin của bản miễn phí, đọc mục "Giá gói" khi trang hoạt động lại;
  2. bot có gửi được cho em đã lâu không nhắn không;
  3. tin có hiện thông báo đẩy của Zalo không, hay chỉ nằm trong hộp tin "người lạ".
- Nếu ổn, đây là kênh hợp nhất với thói quen "mọi thứ qua Zalo" của học sinh.

**Bước 4 – Chỉ khi cần kênh Zalo chính thức, có cam kết (trả phí).**
- Nếu giáo viên hoặc trung tâm có giấy đăng ký hộ kinh doanh/doanh nghiệp: xác thực OA, rồi dùng **ZNS** theo SĐT (khoảng 200 đ/tin, không cần học sinh quan tâm OA). Cách này hợp hơn tin Tư vấn qua API, vì tin Tư vấn vướng khung 7 ngày và cần gói từ 2.500.000 đ/năm.
- Nên gộp tin (tối đa một tin/ngày/em) để giữ chi phí và tránh bị đánh giá chất lượng thấp.

**Không làm:** `zca-js` hay tự động hóa tài khoản Zalo cá nhân; SMS brandname; app gốc.

---

## 6. Điểm chưa chắc chắn, cần kiểm tra

1. **Trình duyệt nội bộ của Zalo trên Android là WebView hay Custom Tabs?** Quyết định Web Push có chạy ngay trong Zalo trên Android không. Kiểm tra trên máy thật bằng `'PushManager' in window`. Trên iPhone thì chắc chắn không chạy.
2. **Tùy chọn "mở link bằng trình duyệt ngoài" của Zalo:** chỉ có nguồn bên thứ ba (2023). Tên và vị trí trên bản Zalo hiện tại chưa xác minh.
3. **Zalo Bot:** giá Premium, hạn mức bản miễn phí (trang `/pricing/` lỗi 500), có khung thời gian gửi chủ động không, tin bot có hiện thông báo như tin bạn bè không.
4. **Zalo OA:** chính sách "8 tin miễn phí trong 48h" (thông báo 2024) lệch với "hoàn toàn miễn phí" (trang hướng dẫn hiện tại). Bài "biểu phí gói OA mới từ 1/6/2026" chưa đọc được. Tài liệu API trên developers.zalo.me không đọc được (trang dựng bằng JS, Chrome không kết nối).
5. **ZNS:** hạn mức tin/ngày khởi điểm của OA mới, thời gian duyệt mẫu, và việc mẫu "bài đã được chấm" có được duyệt vào Tag 2 không. Cần hỏi Zalo hoặc thử nộp mẫu.
6. **Kho lưu trữ khi cài lên Màn hình chính trên iOS** có tách khỏi Safari không. Tôi không tìm được câu khẳng định trong tài liệu WebKit. Nên giả định học sinh phải đăng nhập lại trong app.
7. **Vercel Hobby "non-commercial personal use only":** nếu lớp học có thu phí thì có thể phải lên Pro. Rủi ro này đã có sẵn với `email-api`.
8. **Điều khoản Zalo về phần mềm bên thứ ba:** chỉ có nguồn báo chí thuật lại, chưa đọc được nguyên văn. Kết luận "không dùng `zca-js`" vẫn đứng vững nhờ cảnh báo trong chính README của thư viện.
