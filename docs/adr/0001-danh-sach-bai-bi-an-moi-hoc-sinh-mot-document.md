# Lưu Danh sách bài bị ẩn, một document cho mỗi học sinh

Giáo viên cần ẩn một số Bài tập khỏi giao diện của từng học sinh, nhưng bài tạo mới phải tự hiện với cả nhóm và không được sửa luồng tạo bài tập hay thêm học sinh. Vì vậy chúng tôi lưu phần **bị ẩn** chứ không lưu phần được xem: học sinh không có document, hoặc bài không nằm trong danh sách, thì bài đó hiện bình thường. Mỗi học sinh có tối đa một document trong collection `hiddenAssignments` (id = uid học sinh) chứa mảng `assignmentIds`, để đọc/ghi danh sách của một em chỉ tốn một lần truy cập.

## Considered Options

- **Danh sách bài được xem (allowlist), có công tắc "Xem tất cả / Chỉ bài được chọn"**: bị loại vì bài mới sẽ không tự hiện với học sinh ở chế độ chọn lọc.
- **Allowlist và tự thêm bài mới cho cả nhóm khi tạo bài**: bị loại vì phải sửa trang tạo bài tập, và bài tạo từ nơi khác sẽ bị sót.
- **Một document cho mỗi cặp học sinh–bài**: truy vấn "bài này ẩn với ai" dễ hơn, nhưng một lần lưu phải ghi nhiều document. Truy vấn theo bài vẫn làm được bằng `array-contains`.

## Consequences

- Trang giáo viên hiển thị checkbox "hiện" tích sẵn, nhưng dữ liệu lưu phần ngược lại, nên code đọc/ghi phải đảo nghĩa.
- Đây chỉ là ẩn giao diện (trang chủ và bảng điểm của học sinh), không phải kiểm soát truy cập. Học sinh gõ thẳng URL của bài vẫn vào được, và luật Firestore cho mọi người đọc collection này.
- Khi học sinh chuyển nhóm, id bài của nhóm cũ vẫn nằm trong mảng nhưng vô hại vì không khớp bài nào của nhóm mới.
