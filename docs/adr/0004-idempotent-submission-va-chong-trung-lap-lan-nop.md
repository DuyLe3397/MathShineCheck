# 0004: Idempotent Submission và Chống Trùng Lặp Lần Nộp

## Context

Khi học sinh thực hiện nộp bài tập trên thiết bị di động (`/student/submit/:assignmentId`), thiết bị xử lý nén nhiều ảnh dung lượng lớn bằng HTML5 Canvas trên Main Thread. Trong thời gian này, nếu học sinh chạm/nhấn nút "Nộp bài" nhiều lần liên tiếp (do độ trễ giao diện hoặc mạng chập chờn), các sự kiện click trước đây không bị khóa đồng bộ, dẫn đến việc hàm `submit()` chạy đồng thời nhiều lần.

Ở tầng Firestore, hàm `createSubmission` trước đây sử dụng `addDoc()` với Document ID ngẫu nhiên và không kiểm tra tính tồn tại của Lần nộp. Hệ quả là cùng một học sinh trong cùng một bài tập có thể bị tạo ra 3 bản ghi Lần nộp riêng biệt đều có `attemptNumber = 1` (ví dụ thực tế của học sinh NGUYỄN LÊ TRÍ TẤN ở bài tập `9kPjd4oMqJTLlokL8PRA`), khiến giao diện giáo viên hiển thị 3 dòng giống hệt nhau, số lượng học sinh bị đếm sai và học sinh bị nhảy số lần nộp tiếp theo lên "Lần 4".

## Decision

Chúng tôi triển khai cơ chế phòng thủ 3 tầng:

1. **Khóa đồng bộ và màn che toàn màn hình tại Client (`SubmitComponent`)**:
   - Thêm biến cờ đồng bộ `isSubmitting` kết hợp với Signal `submitting`.
   - Kiểm tra `if (this.isSubmitting || this.submitting()) return;` ngay tại dòng đầu tiên của hàm `submit()`.
   - Vô hiệu hóa `pointer-events: none` trên nút nộp khi bị disabled.
   - Hiển thị màn hình che phủ toàn diện (`loading-overlay`) với hiệu ứng quay và thông báo rõ ràng trong suốt quá trình nén và tải ảnh để triệt tiêu mọi khả năng tương tác nhầm.

2. **Đảm bảo tính Idempotent ở tầng Firestore Service (`FirestoreService.createSubmission`)**:
   - Chuyển Document ID của bản ghi `submissions` sang định dạng cố định: `${assignmentId}_${studentId}_${attemptNumber}`.
   - Kiểm tra tài liệu tồn tại qua `getDoc()` trước khi ghi; nếu đã tồn tại thì trả về ID cũ ngay và không gửi lặp lại thông báo giáo viên hay yêu cầu gửi email thông báo.
   - Dù có nhiều request đồng thời chạm tới Firestore, toàn bộ các request đều tham chiếu tới đúng 1 document duy nhất, bảo đảm 100% không thể sinh bản ghi thừa.

3. **Gom nhóm phòng thủ trên UI (`AssignmentDetailComponent` & `StudentHomeComponent`)**:
   - Khi hiển thị danh sách bài nộp của học sinh, tự động nhóm các bản ghi theo `attemptNumber`.
   - Nếu có các bản ghi trùng lặp từ dữ liệu cũ, hệ thống tự động ưu tiên bản ghi đã được chấm điểm, hoặc bản ghi có `submittedAt` mới nhất.
   - Giao diện giáo viên luôn chỉ hiển thị đúng 1 dòng cho mỗi Lần nộp, và học sinh luôn được tính `nextAttemptNumber = max(attemptNumber) + 1` chuẩn xác mà không đòi hỏi phải xóa cứng dữ liệu lịch sử.

## Consequences

- Không bao giờ xảy ra tình trạng sinh nhiều bản ghi Lần nộp cùng số thứ tự trong cơ sở dữ liệu.
- Các bản ghi cũ bị trùng lặp trên môi trường production tự động được thu gọn hiển thị sạch sẽ trên cả trang giáo viên và trang học sinh.
- Giáo viên không còn bị nhận thông báo hoặc email rác lặp lại khi mạng học sinh chập chờn.
