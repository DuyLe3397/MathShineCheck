# Email thông báo gửi qua Vercel + Gmail SMTP

Ứng dụng không có backend, và học sinh đăng nhập dạng khách (không có tài khoản Firebase Auth). Vì vậy **Email thông báo** do một API nhỏ trên Vercel gửi. API dùng nodemailer với Gmail SMTP và mật khẩu ứng dụng lưu trong biến môi trường Vercel. Lựa chọn này miễn phí, không phải gắn thẻ và gửi được khoảng 500 thư/ngày. Trình duyệt học sinh chỉ gửi `{loại, mã}` của sự kiện. API tự đọc dữ liệu từ Firestore và chỉ gửi khi: sự kiện có thật, được tạo gần đây, người viết là học sinh và chưa có `emailSentAt`. API đánh dấu `emailSentAt` để mỗi sự kiện chỉ gửi một thư.

## Considered Options

- **Firebase Cloud Functions (trigger Firestore)**: chắc chắn nhất và không phụ thuộc trình duyệt học sinh, nhưng phải lên gói Blaze và gắn thẻ. Bị loại vì yêu cầu hoàn toàn miễn phí, không cần thẻ.
- **Google Apps Script (MailApp)**: triển khai nhanh nhất, không cần mật khẩu ứng dụng, nhưng chỉ khoảng 100 thư/ngày. Bị loại vì không đủ số lượng.
- **Gửi SMTP thẳng từ Angular**: không thể làm vì lộ mật khẩu ứng dụng cho bất kỳ ai mở DevTools.

## Consequences

- Email chỉ được gửi nếu trình duyệt học sinh gọi được API sau khi ghi dữ liệu. Mất mạng giữa chừng thì mất email, nhưng Thông báo vẫn còn.
- Mật khẩu ứng dụng Gmail chỉ nằm trên Vercel, không bao giờ nằm trong repo.
- Chuyển sang Cloud Functions về sau thì có thể giữ phần dựng nội dung email, chỉ bỏ lệnh gọi API phía client.
