# Sắp xếp Bài tập theo thời gian tạo

Trước đây, danh sách bài tập ở trang Quản lý bài tập của giáo viên, trang chủ học sinh, trang Thống kê và các màn hình liên quan được sắp xếp giảm dần theo ngày buổi học (`sessionDate desc`). Điều này dẫn đến việc khi giáo viên tạo bài tập mới cho một buổi học trong quá khứ hoặc chuẩn bị bài tập trước cho buổi học tương lai, bài tập không hiển thị ở vị trí đầu danh sách khiến giáo viên và học sinh khó theo dõi. Chúng tôi quyết định chuyển sang sắp xếp bài tập theo thời gian tạo (`createdAt desc`) trên toàn hệ thống.

## Considered Options

- **Sắp xếp theo ngày buổi học (`sessionDate desc`), thời gian tạo làm tiêu chí phụ**: Giữ ngày buổi học làm căn cứ chính, nhưng bài tạo cho các buổi học xa vẫn bị chìm xuống dưới hoặc lẫn giữa các bài cũ. Bị loại vì nhu cầu thực tế của giáo viên và học sinh là bài vừa giao/vừa tạo phải nổi lên đầu trang để xử lý ngay.
- **Chỉ đổi thứ tự ở 2 trang Quản lý bài tập GV và Trang chủ HS**: Giữ nguyên các trang khác như Thống kê hay Phân quyền. Bị loại vì gây ra sự không nhất quán giữa các màn hình trong cùng một nhóm/lớp, làm người dùng bối rối khi tìm kiếm bài tập.
- **Sắp xếp hoàn toàn theo thời gian tạo (`createdAt desc`) trên toàn hệ thống**: Bài tập tạo mới nhất luôn ở trên cùng tại mọi nơi (Quản lý bài tập, Trang chủ học sinh, Thống kê, Phân quyền...). Trường hợp bài cũ thiếu `createdAt` (nếu có) sẽ tự động fallback về `sessionDate`.

## Consequences

- Thứ tự bài tập ở trang Quản lý bài tập (`/teacher/assignments`), Trang chủ học sinh (`/student/home`), Thống kê (`/teacher/statistics`) và các danh sách chọn bài đều hiển thị bài mới tạo nhất lên đầu.
- Giao diện thẻ bài tập của học sinh vẫn giữ nguyên hiển thị Ngày buổi học (`sessionDate`), không làm xáo trộn thông tin học tập của học sinh.
- Cần bổ sung composite index `(groupId ASC, createdAt DESC)` trên collection `assignments` trong Firestore để hỗ trợ truy vấn phân trang `getAssignmentsPage` và `getAssignmentsByGroup`.
- Hàm `getAssignmentsByGroup` bổ sung logic sắp xếp với fallback `a.createdAt || a.sessionDate` để đảm bảo bài tập cũ không bao giờ bị mất hoặc hiển thị sai vị trí.
