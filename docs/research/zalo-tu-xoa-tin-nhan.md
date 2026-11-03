# Nghiên cứu: tin Zalo Bot gửi học sinh có tự xóa hay dọn được sau khoảng 15 phút không?

> Ngày nghiên cứu: 2026-11-03. Mọi nguồn web dưới đây được truy cập ngày 2026-11-03, trừ khi ghi khác.
> Câu hỏi: giáo viên muốn tin Thông báo Zalo mà bot gửi cho học sinh tự xóa sau khoảng 15 phút, để khung chat không bị dồn nhiều tin. Có cách nào làm được không, kể cả gián tiếp, từ miễn phí đến trả phí?
> Bối cảnh: Thông báo Zalo gửi qua Zalo Bot Platform, gói BASIC miễn phí, bot "Bot MathShine Check". Hạ tầng gồm Vercel Hobby (`email-api`), Firebase Hosting và Firestore gói Spark. Xem thêm [thong-bao-hoc-sinh.md](thong-bao-hoc-sinh.md).
>
> Quy ước giống bài trước:
> - Trích dẫn repo theo dạng `file:dòng`, đọc trên working copy ngày 2026-11-03.
> - Số liệu ghi "(tính)" là tôi tự tính từ nguồn chính thức.
> - Ý nào chưa có nguồn gốc kiểm chứng thì ghi **chưa xác minh**.
> - Mức chắc chắn ghi là **cao / trung bình / thấp**.
>
> Tài liệu này chỉ là nghiên cứu: không sửa code, không gửi tin Zalo nào.

---

## 1. Tóm tắt và khuyến nghị

**Làm được không?** **Không**, nếu "tự xóa" nghĩa là bot thu hồi hay xóa tin của chính nó sau 15 phút. Không có đường chính thức nào làm được việc này, miễn phí hay trả phí (mức chắc chắn cao).

1. **Zalo Bot không có API xóa, thu hồi hay sửa tin.**
   - Tài liệu chỉ có 11 API. Sitemap của trang tài liệu cũng không có trang nào khác.
   - `sendMessage` chỉ có 4 tham số (`chat_id`, `text`, `parse_mode`, `text_styles`), không có tham số hết hạn hay tự hủy.
   - Không tìm thấy changelog hay roadmap nào nói sắp có. Gói Pro "Sắp ra mắt" cũng không nhắc tính năng này.
2. **Zalo OA và ZNS (trả phí) cũng không có API thu hồi hay xóa tin.** Trong 318 trang của sitemap tài liệu developers.zalo.me không có trang nào như vậy. Chuyển sang OA thì tốn tiền mà vẫn không giải quyết được.
3. **"Tin nhắn tự xóa" của Zalo** là tính năng người dùng tự bật trong từng cuộc trò chuyện 2 người.
   - Mốc thời gian **ngắn nhất là 1 ngày** (các mốc: 1 ngày, 7 ngày, 30 ngày). **Không có mốc 15 phút.**
   - Học sinh có tự bật được trong khung chat với bot hay không thì **chưa xác minh**: tài liệu Zalo không nhắc tới Bot hay OA. Cần thử trên máy thật.
   - Nếu bật được, đây là cách gần nhất với yêu cầu: miễn phí, chính thức, nhưng tin chỉ tự xóa sau 1 ngày.
4. **Học sinh tự dọn** bằng "Xóa hội thoại", "Ẩn trò chuyện", "Tắt thông báo", "Ghim". Các thao tác này đều chính thức, nhưng phải làm tay. "Ẩn trò chuyện" và "Tắt thông báo" còn làm mất tác dụng báo tin.
5. **Không khuyến nghị:** `zca-js`, thư viện không chính thức trên tài khoản Zalo **cá nhân**. Thư viện này có thu hồi tin và đặt hạn tồn tại cho từng tin, nhưng README cảnh báo có thể bị khóa tài khoản. Ngoài ra tin sẽ đến từ Zalo cá nhân của giáo viên, không phải từ bot.

**Khuyến nghị:** không cố xóa tin mà **giảm số tin**. Làm theo thứ tự sau, tất cả đều 0 đồng (chi tiết ở mục 5).

| Bước | Việc | Hiệu quả | Chi phí |
|---|---|---|---|
| 1 | **Gộp tin điểm và tin nhận xét thành 1 tin** mỗi lần bấm nút đỏ, rút gọn nội dung | Tối đa 1 tin cho mỗi lần bấm (hiện tại tối đa 2) | 0 đ, sửa nhỏ trong `email-api/lib/zalo.js` |
| 2 | **Gom tin theo học sinh trong một khoảng ngắn** (debounce, ví dụ 3 phút): chấm liền nhiều Lần nộp của một em thì em chỉ nhận 1 tin | Hết cảnh nhiều tin liên tiếp | 0 đ: Vercel Queues (Beta, có sẵn trên Hobby) hoặc Upstash QStash gói Free |
| 3 | Hướng dẫn học sinh bật "Tin nhắn tự xóa" 1 ngày trong khung chat với bot, **nếu thử thấy có** | Khung chat tự sạch sau 1 ngày | 0 đ |
| (tùy chọn) | Cho học sinh chọn nhận "1 tin tổng hợp mỗi tối" thay cho tin ngay | Tối đa 1 tin mỗi ngày | 0 đ: Vercel Cron Hobby (1 lần/ngày) |

Bước 1 và 2 còn giúp tiết kiệm hạn mức. Theo trang chủ Zalo Bot Platform, gói Basic chỉ cho gửi tối đa **3.000 tin mỗi tháng**, và mỗi bot tương tác với tối đa **50 người dùng**.

---

## 2. Bảng so sánh các phương án (miễn phí đến trả phí)

| # | Phương án | Có thật sự "dọn" khung chat không | Sau bao lâu | Học sinh phải làm gì | Chi phí | Chắc chắn |
|---|---|---|---|---|---|---|
| 1 | Bot tự xóa hoặc thu hồi tin qua API | **Không làm được**: không có API | – | – | – | Cao |
| 2 | Tham số tự hủy hoặc hết hạn trong `sendMessage` | **Không làm được**: không có tham số | – | – | – | Cao |
| 3 | Gộp thành 1 tin mỗi lần bấm, rút gọn | Không xóa, nhưng **ít tin hơn** (tối đa 1 thay vì 2) | – | Không | 0 đ | Cao |
| 4 | Gom tin theo học sinh trong vài phút (debounce) bằng Vercel Queues hoặc QStash | Không xóa, **ít tin hơn nhiều** khi chấm dồn | Tin đến trễ vài phút | Không | 0 đ trong hạn mức miễn phí | Cao về hạn mức, trung bình về Vercel Queues (đang Beta) |
| 5 | Gom bằng cron-job.org gọi API mỗi phút | Như 4 | Như 4 | Không | 0 đ | Trung bình (trang của cron-job.org không đọc trực tiếp được) |
| 6 | Tin tổng hợp mỗi ngày bằng Vercel Cron Hobby | Tối đa 1 tin/ngày | Trễ tới cuối ngày, lệch tới ±59 phút | Chọn chế độ này (nếu làm tùy chọn) | 0 đ | Cao |
| 7 | Học sinh bật "Tin nhắn tự xóa" trong khung chat với bot | **Có**, xóa cho cả hai bên | **Ít nhất 1 ngày** (không có 15 phút) | Bật một lần trong menu cuộc trò chuyện | 0 đ | Mốc thời gian: cao. **Áp dụng cho bot: chưa xác minh** |
| 8 | Học sinh tự "Xóa hội thoại" | Có, phía học sinh | Khi em tự làm | Làm tay mỗi lần | 0 đ | Cao (có trong hướng dẫn Zalo PC) |
| 9 | Học sinh "Ẩn trò chuyện", "Tắt thông báo" hoặc ghim chat khác lên trên | Chỉ giấu hoặc làm im, **không xóa**; làm mất tác dụng báo tin | – | Làm một lần | 0 đ | Cao |
| 10 | Chuyển sang Zalo OA hoặc ZNS (trả phí) | **Không**: OA và ZNS cũng không có API thu hồi | – | Quan tâm OA hoặc không cần | Từ 2.500.000 đ/năm (OA) hoặc khoảng 200 đ/tin (ZNS), cần pháp nhân | Cao |
| 11 | Gói Zalo Bot Pro 129.000 đ/tháng | Không thấy nhắc tính năng xóa | – | – | "Sắp ra mắt" | Trung bình |
| ✗ | `zca-js` trên Zalo cá nhân của giáo viên (`undo`, `ttl`) | Có, về mặt kỹ thuật | Tùy ý | Không | 0 đ | **Rủi ro khóa tài khoản, không khuyến nghị** |

---

## 3. Hiện trạng code liên quan

| Điểm | Mô tả | Vị trí |
|---|---|---|
| Nút đỏ gọi API | `saveGrade(true)` lưu điểm rồi gọi `requestZaloNotice(submissionId)` và không chờ kết quả | `src/app/pages/teacher/grading.component.ts:1508`, `:1550`; `src/app/services/firestore.service.ts:831-841` |
| API | `POST /api/zalo-notify` gọi `notifySubmissionSafe` | `email-api/api/zalo-notify.js:7-15`, `email-api/lib/zalo-run.js:9-16` |
| Số tin mỗi lần bấm | **Tối đa 2 tin riêng**: tin điểm (khi điểm mới hoặc đổi) và tin nhận xét (khi có Nhận xét theo ảnh mới). Mỗi tin là một lần gọi `sendMessage` | `email-api/lib/zalo.js:157-179`, `:199-202` |
| Trạng thái chống gửi trùng | `zaloState/<mã Lần nộp>` = `{ score, sentAt }`, **theo từng Lần nộp**, không theo học sinh | `email-api/lib/zalo.js:139-141`, `:196` |
| Giới hạn tuổi của điểm | Điểm phải được lưu trong vòng 10 phút trước khi gửi (`MAX_AGE_MS`), quá thì trả `too-old` | `email-api/lib/zalo.js:15`, `:136-137` |
| Nội dung tin điểm | Tên bài, lần nộp, điểm có màu, Nhận xét chung (cắt ở 300 ký tự), link | `email-api/lib/zalo.js:158-170` |
| Giữ lại `message_id`? | Không lưu `result.message_id` mà `sendMessage` trả về. Hiện cũng không cần, vì không có API nào dùng tới nó | `email-api/lib/zalo.js:29-31` |
| Cron, hàng đợi | `email-api` chưa có `vercel.json`, chưa có cron hay hàng đợi | thư mục `email-api/` |

Hệ quả: nếu giáo viên chấm liền 3 Lần nộp của một em, mỗi Lần nộp đều có điểm và nhận xét, thì em nhận tới **6 tin** liên tiếp (tính). Đây là nguồn chính gây "dồn tin".

---

## 4. Chi tiết từng phương án

### 4.1. Zalo Bot Platform: có xóa, thu hồi, sửa tin hay tự hủy không?

**Kết luận: không có** (mức chắc chắn cao). Bằng chứng:

- **Mục lục tài liệu** ([bot.zaloplatforms.com/docs](https://bot.zaloplatforms.com/docs/)) chỉ có 11 API: getMe, getUpdates, setWebhook, testWebhook, deleteWebhook, getWebhookInfo, sendMessage, sendPhoto, sendSticker, sendVoice, sendChatAction. `deleteWebhook` là xóa cấu hình webhook, không phải xóa tin.
- **Sitemap** ([bot.zaloplatforms.com/sitemap.xml](https://bot.zaloplatforms.com/sitemap.xml)) liệt kê đúng 11 trang API đó, cộng các trang hướng dẫn: authorize, build-bot-interaction-with-group, build-personal-assistant-with-open-claw, build-your-bot, build-your-bot-with-webhook, call-api, create-bot, error-code, terms, webhook. **Không có** trang changelog, roadmap hay API nào khác. Tôi cũng tải toàn bộ 41 gói JS của trang tài liệu và tìm các từ "thu hồi", "deleteMessage", "editMessage", "tự xóa", "tự hủy": không có kết quả nào nói về tin nhắn. Chữ "thu hồi" duy nhất nằm trong điều khoản và nói về quyền sử dụng có thể bị thu hồi.
- **Gọi thử bằng token thật** (đã làm ngày 2026-11-03, trước bài này): `deleteMessage`, `recallMessage`, `unsendMessage`, `editMessageText` đều trả `{"ok":false,"description":"Not Found","error_code":404}`, giống hệt một tên bịa (`khongtontai`). Trong khi đó `getWebhookInfo` trả `ok`.
- **`sendMessage`** ([tài liệu](https://bot.zaloplatforms.com/docs/apis/sendMessage/)) chỉ có `chat_id`, `text` (1 đến 2000 ký tự), `parse_mode`, `text_styles`. **Không có** tham số hết hạn, tự hủy, gửi im lặng hay trả lời tin. Kết quả trả về có `message_id` và `date`. Có `message_id` không có nghĩa là xóa được tin, vì không có API nào nhận `message_id`.
- **Webhook** chỉ có các sự kiện `message.text.received`, `message.image.received`, `message.sticker.received`, `message.voice.received`, `message.unsupported.received` ([Webhook](https://bot.zaloplatforms.com/docs/webhook/)). Không có sự kiện người dùng xóa hay thu hồi tin.
- **Trang chủ, mục giá** ([bot.zaloplatforms.com](https://bot.zaloplatforms.com/)):
  - Gói **Basic** miễn phí: "Tạo tối đa 3 Bot", "Mỗi Bot tương tác với tối đa với 50 người dùng", "Cho phép gửi tối đa 3.000 tin nhắn mỗi tháng", "Tương tác với 3 nhóm Chat (Beta)".
  - Gói **Pro** 129.000 đ/tháng, "Sắp ra mắt". Phần mô tả chỉ nói nâng số người dùng, số nhóm và hạn mức tin, không nhắc xóa hay thu hồi tin.
  - Trang `/pricing` và `/faq` riêng trả lỗi 500. Nội dung giá và FAQ ở trên tôi đọc từ trang chủ.
- **FAQ trên trang chủ:**
  - Về gửi chủ động: "Bạn có thể chủ động nhắn tin cho người dùng đã từng tương tác, nhưng cần tuân theo chính sách nhắn tin chủ động của Zalo." Tôi không tìm thấy "chính sách nhắn tin chủ động" ở đâu (**chưa xác minh**).
  - Về hạn mức: FAQ nói gói miễn phí giới hạn tin "mỗi ngày", còn bảng giá ghi "mỗi tháng". Hai chỗ **không khớp nhau**.
- **Điều khoản** ([Điều khoản](https://bot.zaloplatforms.com/docs/terms/)) không có quy định nào về xóa tin phía người nhận. Các ý liên quan:
  - Cấm "Phá hoại, gây quá tải, làm gián đoạn…" (mục VIII). Gọi API dồn dập để thử các cách lách là không nên.
  - Người dùng từ 13 đến dưới 18 tuổi cần "sự đồng ý và giám sát của cha, mẹ hoặc người giám hộ hợp pháp" (mục III.2).
  - Cấm dùng phần mềm "để ra quyết định tự động liên quan đến … giáo dục" nếu không có chuyên gia xác minh hoặc cảnh báo. MathShine không vướng điều này, vì giáo viên tự chấm, bot chỉ báo.

### 4.2. Tính năng "Tin nhắn tự xóa" của Zalo

Nguồn chính thức: [Tin nhắn tự xóa – Tính năng mới bảo vệ riêng tư cho trò chuyện](https://help.zalo.me/huong-dan/tinh-nang-co-ban/tin-nhan-tu-xoa-tinh-nang-moi-bao-ve-rieng-tu-cho-tro-chuyen/). Bài đăng ngày 2022-04-15, sửa lần cuối ngày 2025-05-30 (theo thẻ meta của trang).

- **Là gì:** tin "có thể tự biến mất sau khoảng thời gian nhất định mà không cần người dùng phải thực hiện xóa thủ công". Tin được xóa "cho mọi người trong trò chuyện", "vĩnh viễn và không thể được khôi phục".
- **Mốc thời gian:**
  - Phần chữ của bài ghi "như 1 ngày, 7 ngày, 30 ngày".
  - Ảnh hướng dẫn trên điện thoại cho thấy bộ chọn gồm: Không tự xóa, 1 ngày, 7 ngày, 30 ngày.
  - Ảnh hướng dẫn trên Zalo PC cho thấy menu gồm: 1 ngày, 7 ngày, 30 ngày, Không bao giờ.
  - Vậy **mốc ngắn nhất là 1 ngày, không có 15 phút** (mức chắc chắn cao với bản Zalo trong ảnh; bản Zalo hiện tại có thể khác, **chưa xác minh**).
- **Phạm vi:**
  - "Hiện tại, tin nhắn tự xóa chỉ hỗ trợ trò chuyện 2 người." Nhóm thì "sẽ sớm được cập nhật".
  - Chỉ áp dụng cho tin "được gửi kể từ thời điểm bật". Tin cũ không bị xóa.
  - Tắt tính năng thì tin đã gửi trong lúc bật vẫn tự xóa đúng hạn, tin gửi sau khi tắt thì không.
- **Ai bật:** bài hướng dẫn mô tả người dùng tự bật trong menu của cuộc trò chuyện, trên Zalo điện thoại và Zalo PC (trên PC: chuột phải vào hội thoại, chọn "Tin nhắn tự xóa"). Bài **không nói** người kia có được báo hay không.
- **Có dùng được với Bot hoặc OA không?** Bài **không nhắc** Official Account hay Bot. Cuộc trò chuyện với bot là chat 1-1 (`chat_type: "PRIVATE"`, xem `email-api/lib/zalo.js:55`). Nhưng bot là loại tài khoản đặc biệt, nên mục "Tin nhắn tự xóa" có hiện trong menu hay không thì **chưa xác minh**. Cách kiểm tra: học sinh (hoặc giáo viên dùng một tài khoản đã liên kết) mở chat với "Bot MathShine Check", bấm biểu tượng menu (☰) ở góc phải trên, tìm mục "Tin nhắn tự xóa".
- **Bot có tự bật được cho học sinh không?** **Không.** Bot API không có hàm nào cài đặt cuộc trò chuyện (mục 4.1).
- **Nếu bật được:** đây là cách chính thức duy nhất để tin bot thật sự biến mất khỏi khung chat của học sinh, nhưng **sau 1 ngày**, không phải 15 phút. Mỗi em phải tự bật một lần. Bật xong thì cả tin em gửi cho bot (ví dụ mã liên kết) cũng bị xóa, việc này vô hại.

### 4.3. Zalo OA và ZNS (trả phí): có API thu hồi hay xóa tin không?

**Kết luận: không có** (mức chắc chắn cao).

- Trang tài liệu developers.zalo.me dựng bằng JavaScript. Nội dung thật nằm trong một trang Docusaurus nhúng, có sitemap tại [stc-developers.zdn.vn/docs/sitemap.xml](https://stc-developers.zdn.vn/docs/sitemap.xml). Sitemap này có 318 trang: 183 trang OA, 35 trang ZBS Template Message, 31 trang ZNS và các mục khác.
- Mục **"Tin nhắn"** của OA API chỉ gồm:
  - gửi tin Tư vấn, Giao dịch, Truyền thông, các loại tin khác;
  - thả biểu tượng cảm xúc;
  - nhóm "Quản lý tin nhắn": kiểm tra hạn mức, kiểm tra khung 48h, lấy tin gần nhất, lấy tin trong hội thoại, upload ảnh, GIF hay file.

  Ví dụ [Tổng quan tin nhắn OA](https://developers.zalo.me/docs/official-account/tin-nhan/tong-quan). **Không có** trang nào thu hồi, xóa hay sửa tin đã gửi.
- Các trang có chữ "xóa" trong sitemap đều không phải xóa tin. Chúng là: xóa nhãn, xóa thông tin người dùng, xóa trường tùy biến, xóa bài viết, giải tán nhóm GMF (`delete_group`).
- ZNS và ZBS Template Message chỉ có gửi tin, quản lý mẫu, truy xuất trạng thái hay hạn mức, và webhook. **Không có** thu hồi.
- OA Manager (giáo viên gửi tay trên oa.zalo.me) có nút thu hồi tin hay không thì **chưa xác minh**: tôi không tìm được trang chính thức nào. Kể cả nếu có thì đó là thao tác tay, không tự động được.
- Điều kiện và chi phí OA, ZNS đã có ở [thong-bao-hoc-sinh.md](thong-bao-hoc-sinh.md), mục 3.3 và 3.4: OA phải xác thực (cần pháp nhân), gói API từ 2.500.000 đ/năm, ZNS khoảng 200 đ/tin. **Trả phí cũng không mua được tính năng tự xóa.**

### 4.4. Học sinh tự dọn: các thao tác chính thức của Zalo

| Thao tác | Tác dụng | Có "dọn" không | Nguồn chính thức |
|---|---|---|---|
| **Xóa hội thoại** | PC: chuột phải vào cuộc trò chuyện, chọn "Xóa hội thoại". Xóa lịch sử phía mình. Bot vẫn nhắn tiếp được, vì liên kết `zaloChats` không đổi (suy luận: bot không nhận được sự kiện nào như vậy) | Có, phía học sinh, làm tay | [Các tiện ích cơ bản khi nhắn tin trên Zalo máy tính](https://help.zalo.me/huong-dan/chuyen-muc/nhan-tin-va-goi/nhan-tin/cac-tien-ich-co-ban-khi-nhan-tin-tren-zalo-may-tinh/) (sửa 2026-01-16). Ảnh trong bài Tin nhắn tự xóa cũng có mục "Xóa hội thoại". Bản điện thoại không tìm được trang hướng dẫn riêng (**chưa xác minh** tên mục) |
| **Thu hồi** | Chỉ **người gửi** thu hồi được tin của chính mình, trong 24 giờ: "Bạn chỉ có thể thu hồi tin nhắn trong 24 giờ sau khi gửi." Học sinh **không** thu hồi được tin của bot | Không áp dụng | [Gửi, thu hồi và chia sẻ tin nhắn](https://help.zalo.me/huong-dan/chuyen-muc/nhan-tin-va-goi/nhan-tin/gui-tin-nhan-mien-phi/) (sửa 2026-10-06) |
| **Xóa từng tin phía mình** | Nhiều bài bên thứ ba mô tả, nhưng tôi không tìm được trang chính thức | Có, phía học sinh | **Chưa xác minh** |
| **Ẩn trò chuyện** | Giấu cuộc trò chuyện khỏi trang Tin nhắn bằng mã PIN 4 số. Khi có tin mới, thông báo vẫn đến nhưng tên người gửi và nội dung bị ẩn | **Không xóa**, chỉ giấu, và làm học sinh khó thấy tin bot | [Ẩn trò chuyện Zalo](https://help.zalo.me/huong-dan/chuyen-muc/nhan-tin-va-goi/nhan-tin/an-tro-chuyen/) (sửa 2026-10-08) |
| **Tắt thông báo** | "Chọn khoảng thời gian muốn tắt thông báo hoặc tắt cho đến khi được mở lại" | **Không xóa**, chỉ không reo. Mất ý nghĩa báo tin | Bài Zalo PC ở trên |
| **Ghim trò chuyện, ghim tin** | Ghim chat quan trọng lên đầu danh sách, hoặc ghim tin quan trọng lên đầu một cuộc trò chuyện | Không xóa. Giúp tin bot không che chat khác, nhưng không giảm số tin | Bài Zalo PC ở trên; [Ghim những tin nhắn quan trọng](https://help.zalo.me/huong-dan/chuyen-muc/nhan-tin-va-goi/nhan-tin/huong-dan-ghim-nhung-tin-nhan-quan-trong/) |
| **Gỡ liên kết** (của MathShine) | Nhắn "tắt" cho bot thì xóa `zaloChats` (`email-api/lib/zalo.js:57-62`) | Dừng hẳn tin mới | Code hiện có |

Nhận xét: mọi thao tác trên đều phải **làm tay, ở phía học sinh**. Chỉ "Xóa hội thoại" là thật sự dọn. Với học sinh, "Tin nhắn tự xóa" 1 ngày (mục 4.2, nếu có) đỡ công hơn nhiều.

### 4.5. Giảm dồn tin thay cho xóa (phân tích trên code hiện tại, không sửa code)

#### A. Gộp tin điểm và tin nhận xét thành 1 tin mỗi lần bấm (0 đ, làm ngay được)

- Hiện tại `planSubmissionNotice` đẩy tối đa 2 phần tử vào `messages` (`email-api/lib/zalo.js:158-179`), và `notifySubmission` gửi từng tin (`:199-202`).
- Có thể ghép hai phần bằng một hàm `rich()` duy nhất (ngăn bằng dòng trống) để chỉ gọi `sendMessage` một lần. `rich()` tự tính lại vị trí `text_styles` (`:108-117`), nên ghép không làm lệch định dạng.
- Giới hạn 2.000 ký tự của `text` vẫn dư: Nhận xét chung đã được cắt ở 300 ký tự (`:167`).
- Đơn giản thêm được một phần: logic khôi phục khi "gửi được tin 1, lỗi tin 2" (`:203-211`) gần như không còn cần.
- Hiệu quả: số tin giảm tối đa một nửa. Hạn mức 3.000 tin/tháng đủ cho khoảng 3.000 lần bấm thay vì khoảng 1.500 (tính).

#### B. Rút gọn nội dung (0 đ)

- Ví dụ bỏ Nhận xét chung khỏi tin, chỉ để tên bài, điểm và link. Hoặc thay link dài `…/student/results/<id>` bằng chữ ngắn có định dạng.
- Không giảm số tin, nhưng mỗi tin chiếm ít chỗ hơn trên màn hình.
- Đánh đổi: học sinh phải bấm link mới thấy nhận xét.

#### C. Chỉ gửi khi có điểm

- Code **đã** gần như vậy: chỉ nút đỏ mới gửi. Tin nhận xét chỉ đi kèm lúc bấm nút đỏ, và chỉ khi có Nhận xét theo ảnh mới (`CONTEXT.md`, mục "Thông báo Zalo"; `email-api/lib/zalo.js:151`).
- Có thể siết thêm: không gửi tin riêng khi chỉ có nhận xét mới mà điểm không đổi, hoặc gộp hẳn vào tin điểm như cách A.
- Đánh đổi: học sinh không biết có nhận xét mới nếu điểm giữ nguyên.

#### D. Gom nhiều lần chấm của cùng một học sinh trong vài phút thành 1 tin (debounce)

**Ý tưởng** (trailing debounce, không cần hủy tin đã hẹn):

1. Khi bấm nút đỏ, API **không gửi ngay**. Nó ghi `zaloPending/<studentId>` = `{ submissionIds: [...], lastAt }`, rồi hẹn một lần gọi lại `POST /api/zalo-flush` sau N phút (ví dụ 3).
2. Khi được gọi lại, `zalo-flush` kiểm tra `now - lastAt >= N phút`:
   - nếu chưa đủ thì bỏ qua, vì còn lần hẹn của lần bấm sau;
   - nếu đủ thì dựng **một** tin cho tất cả Lần nộp đang chờ (dùng lại `planSubmissionNotice` cho từng Lần nộp), gửi, rồi xóa `zaloPending`.
3. Cần sửa thêm hai chỗ:
   - `zaloState` hiện theo từng Lần nộp. Vẫn giữ được, nhưng phải ghi `zaloState` cho mọi Lần nộp trong tin gộp.
   - `MAX_AGE_MS` = 10 phút (`email-api/lib/zalo.js:15`, `:137`) sẽ chặn những Lần nộp đã chấm quá 10 phút trước lúc flush. Vì vậy N phải nhỏ hơn nhiều so với 10 phút, hoặc phải đổi điều kiện này.
4. Endpoint `zalo-flush` phải xác thực người gọi: chữ ký của hàng đợi hoặc một secret. Nếu không, ai cũng gọi được để bắn tin.

**Hạ tầng hẹn giờ:**

| Cách | Làm được? | Giới hạn chính thức | Chi phí (tính) | Ghi chú |
|---|---|---|---|---|
| **Vercel Cron (Hobby)** | **Không** cho debounce vài phút | Hobby: chạy "Once per day", độ chính xác "Per-hour (±59 min)". Biểu thức chạy dày hơn sẽ "fail deployment" ([Vercel Cron usage & pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing), cập nhật 2026-07-15) | 0 đ | Chỉ hợp với **tin tổng hợp mỗi ngày** (cách E) |
| **Vercel Queues** | **Có** | "available in Beta on all plans". Delay từ 0 giây tới 7 ngày (không quá TTL). TTL tối thiểu 60 giây, mặc định 24 giờ. Có idempotency key ([Queues](https://vercel.com/docs/queues), [Queues pricing](https://vercel.com/docs/queues/pricing), cập nhật 2026-08-12) | 0 đ: Hobby có sẵn 1.000.000 lượt thao tác. Mỗi lần bấm khoảng 2 đến 3 lượt (gửi, đẩy, xác nhận), nên dư rất xa (tính) | Không cần tài khoản ngoài. Nhưng đang **Beta**, API có thể đổi |
| **Upstash QStash** | **Có** | Header `Upstash-Delay` (ví dụ `3m`) hoặc `Upstash-Not-Before`. Gói Free: delay tối đa 7 ngày ([QStash Delay](https://upstash.com/docs/qstash/features/delay)), 1.000 tin/ngày, 10 lịch, tin tối đa 1MB. Pay as you go 1 USD/100.000 tin ([QStash pricing](https://upstash.com/pricing/qstash)). Có API hủy tin đang chờ ([Cancel a Message](https://upstash.com/docs/qstash/api-reference/messages/cancel-a-message.md)). `Upstash-Deduplication-Id` có cửa sổ 10 phút ([Deduplication](https://upstash.com/docs/qstash/features/deduplication)) | 0 đ: 1.000 tin/ngày dư cho một lớp học | Thêm một tài khoản và một secret. Phải xác minh chữ ký `Upstash-Signature` ở `zalo-flush`. Không nên dùng dedup theo `studentId`, vì cửa sổ 10 phút sẽ nuốt lần hẹn của lần bấm sau. Dùng kiểm tra `lastAt` như ở trên |
| **cron-job.org** gọi `zalo-flush` mỗi phút | **Có** | Mỗi job chạy tối đa 60 lần mỗi giờ, timeout 30 giây ([cron-job.org FAQ](https://cron-job.org/faq/); trang không mở được trực tiếp, nội dung lấy qua kết quả tìm kiếm, mức chắc chắn **trung bình**) | 0 đ. Phía Vercel: 1.440 lượt gọi/ngày, khoảng 43.200/tháng, chiếm khoảng 4% hạn mức 1.000.000 lượt gọi function/tháng của Hobby ([Vercel functions pricing](https://vercel.com/docs/functions/usage-and-pricing)) (tính) | Đơn giản: `zalo-flush` quét mọi `zaloPending` có `lastAt` cũ hơn N phút. Phụ thuộc dịch vụ bên thứ ba miễn phí, không có cam kết |
| Chờ ngay trong function (`setTimeout` vài phút rồi mới gửi) | Về kỹ thuật thì được | Hobby cho function chạy tối đa 300 giây. Memory bị tính liên tục cả lúc chờ I/O ([Vercel functions pricing](https://vercel.com/docs/functions/usage-and-pricing), [Hobby plan](https://vercel.com/docs/plans/hobby)) | Ví dụ 1.500 lần bấm × 2 GB × 120 giây ≈ 100 GB-giờ/tháng, trong tổng 360 GB-giờ của Hobby (tính, giả định 2 GB) | Dễ hỏng (function bị dừng thì mất tin), tốn tài nguyên. **Không khuyến nghị** |

**Đánh đổi chung của debounce:** tin đến trễ N phút. Nút đỏ không còn "gửi ngay" như tên gọi, nên có thể phải đổi chữ trên nút hoặc ghi chú trong `CONTEXT.md`.

#### E. Tin tổng hợp mỗi ngày (tùy chọn cho học sinh)

- Vercel Cron Hobby chạy 1 lần/ngày, lệch tối đa 59 phút (nguồn ở bảng trên). Đủ cho một tin "Hôm nay em có N bài được chấm: …" gửi buổi tối.
- 0 đ, không cần dịch vụ ngoài.
- Đánh đổi: không còn "thấy ngay". Nên để học sinh tự chọn trong thẻ "Nhận thông báo qua Zalo" (`src/app/pages/student/zalo-link-card.component.ts`).
- Lưu ý thêm: Hobby chỉ cho "non-commercial, personal use only" ([Hobby plan](https://vercel.com/docs/plans/hobby)). Rủi ro này đã có từ trước với `email-api`.

### 4.6. Cách không chính thức: `zca-js` trên tài khoản Zalo cá nhân

- `zca-js` là "an unofficial Zalo API for personal account. It work by simulating the browser to interact with Zalo Web" ([README](https://github.com/RFS-ADRENO/zca-js)).
- Mã nguồn có:
  - `undo` (thu hồi tin theo `msgId`, `cliMsgId`);
  - `deleteMessage`;
  - tùy chọn `ttl` ("Time to live in milliseconds") cho từng tin trong `sendMessage`;
  - `updateAutoDeleteChat` với các mốc 1 ngày, 7 ngày, 14 ngày ([src/apis](https://github.com/RFS-ADRENO/zca-js/tree/main/src/apis)).

  Điều này gợi ý giao thức nội bộ của Zalo có hỗ trợ tin hết hạn theo mili giây, nhưng Zalo **không mở** khả năng đó cho Bot hay OA.
- **Rủi ro**, theo chính README: "Using this API could get your account locked or banned. We are not responsible for any issues that may happen. Use it at your own risk."
- Các vấn đề khác:
  - Tin sẽ đến từ **Zalo cá nhân của giáo viên**, không phải từ bot. Như vậy phải bỏ hẳn kiến trúc Zalo Bot đang có.
  - Phải giữ cookie hay phiên đăng nhập của tài khoản cá nhân trên server.
  - Nếu bị khóa, giáo viên mất tài khoản đang dùng để liên lạc với cả lớp.
- **Không khuyến nghị.** Mục này chỉ để ghi nhận.

---

## 5. Khuyến nghị cho MathShine

1. **Nói rõ với giáo viên:** bot không tự xóa được tin, cả bản miễn phí lẫn trả phí, và OA hay ZNS cũng không. Mục tiêu nên đổi thành "ít tin hơn".
2. **Làm ngay (0 đ):** gộp tin điểm và tin nhận xét thành **1 tin mỗi lần bấm** (mục 4.5 A), có thể rút gọn thêm (B). Đây là sửa nhỏ trong `email-api/lib/zalo.js`, cập nhật test `email-api/test/zalo.test.js` và đoạn "Thông báo Zalo" trong `CONTEXT.md` (hiện ghi "gửi tối đa hai tin").
3. **Thử trên máy thật (0 đ, 5 phút):** mở chat với "Bot MathShine Check" và xem có mục "Tin nhắn tự xóa" không.
   - Nếu có: thêm một dòng hướng dẫn vào thẻ "Nhận thông báo qua Zalo" và vào tin xác nhận liên kết của bot, ví dụ "Mẹo: bật Tin nhắn tự xóa 1 ngày để khung chat luôn gọn".
4. **Nếu giáo viên hay chấm dồn nhiều Lần nộp của cùng một em:** làm debounce 2 đến 3 phút (mục 4.5 D).
   - Ưu tiên **Vercel Queues** vì không cần tài khoản ngoài, nhưng phải chấp nhận Beta.
   - Hoặc **QStash** gói Free, ổn định hơn nhưng thêm một dịch vụ.
   - Cần sửa điều kiện `MAX_AGE_MS` cho hợp.
5. **Không làm:** chuyển sang OA hay ZNS chỉ để xóa tin (không có tính năng này), `zca-js`, chờ trong function.

---

## 6. Điểm chưa chắc chắn, cần kiểm tra

1. **"Tin nhắn tự xóa" có hiện trong khung chat với Zalo Bot không.** Tài liệu Zalo chỉ nói "trò chuyện 2 người", không nhắc Bot hay OA. Phải thử trên điện thoại và Zalo PC.
2. **Danh sách mốc thời gian trên bản Zalo hiện tại.** Bài hướng dẫn sửa lần cuối ngày 2025-05-30, ảnh minh họa có 1, 7, 30 ngày. `zca-js` lại có hằng số 14 ngày và không có 30 ngày. Có thể Zalo đã đổi các mốc, nhưng chưa thấy nguồn nào cho mốc dưới 1 ngày.
3. **Zalo Bot có thêm API xóa hay thu hồi trong tương lai không.** Không có changelog hay roadmap công khai. Trang `/pricing` và `/faq` riêng lỗi 500 lúc tra. Nên kiểm tra lại mục lục tài liệu định kỳ, nhất là khi gói Pro ra mắt.
4. **Hạn mức gói Basic.** Bảng giá ghi 3.000 tin/**tháng**, FAQ ghi giới hạn tin "mỗi ngày". Giới hạn "50 người dùng mỗi bot" có thể chạm trần nếu lớp đông. Mục này ngoài câu hỏi chính nhưng ảnh hưởng thiết kế: lớp hơn 50 em thì cần bot thứ hai hoặc gói Pro.
5. **"Chính sách nhắn tin chủ động của Zalo"** mà FAQ của Zalo Bot nhắc tới: không tìm được văn bản. Có thể có khung thời gian sau lần tương tác cuối, giống OA (7 ngày qua API).
6. **OA Manager có nút thu hồi tin gửi tay không:** chưa xác minh. Dù có thì cũng không tự động được.
7. **Thao tác xóa từng tin phía mình và tên mục "Xóa lịch sử trò chuyện" trên Zalo điện thoại:** chỉ có nguồn bên thứ ba, không có trang trợ giúp chính thức.
8. **cron-job.org:** số liệu (60 lần mỗi giờ, timeout 30 giây) lấy qua kết quả tìm kiếm trỏ tới [FAQ chính thức](https://cron-job.org/faq/). Trang không mở trực tiếp được (lỗi kết nối) lúc tra.
9. **Vercel Queues đang Beta.** Giá, giới hạn và cách khai báo trigger (`experimentalTriggers`, `queue/v2beta`) có thể đổi.
10. **Phát hiện phụ:** tài liệu webhook của Zalo Bot ghi rằng nếu người gửi thuộc "nhóm đối tượng đặc biệt (bao gồm nhưng không giới hạn: trẻ em, …)" thì bot nhận sự kiện `message.unsupported.received` thay cho nội dung tin ([Webhook](https://bot.zaloplatforms.com/docs/webhook/)). `handleUpdate` hiện bỏ qua mọi sự kiện khác `message.text.received` (`email-api/lib/zalo.js:52`). Vì vậy một học sinh nhỏ tuổi có thể **không liên kết được** bằng mã, và bot cũng không trả lời gì. Nên thử với tài khoản Zalo của một học sinh nhỏ tuổi.
