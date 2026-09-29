# MathShine Check

Hệ thống giao bài, nộp bài và chấm điểm môn Toán cho giáo viên và học sinh, tổ chức theo Lớp → Nhóm.

## Language

**Bài có điểm**:
Một bài tập mà học sinh có ít nhất một Lần nộp được chấm có điểm (khác **Chấm không điểm**). Nếu chấm nhiều lần thì lấy điểm cao nhất.
_Avoid_: bài đã làm, bài đã nộp

**Chấm không điểm**:
Giáo viên đã chấm một Lần nộp (có thể kèm Nhận xét chung) nhưng không cho điểm; giáo viên thể hiện bằng cách nhập điểm 0. Ở mọi nơi hiển thị là "-", không tính vào điểm trung bình. Hệ thống không có điểm 0 thật.
_Avoid_: điểm 0, điểm liệt

**Bài thiếu điểm**:
Một bài tập trong phạm vi đang xét mà học sinh chưa có điểm — gồm chưa nộp, đã nộp nhưng chưa chấm, và mọi Lần nộp đều **Chấm không điểm**.
_Avoid_: bài trống, bài chưa làm

**Phạm vi thống kê**:
Tập bài tập của một Nhóm đang được xét trên trang Thống kê: các bài có ngày buổi học nằm trong khoảng Từ ngày – Đến ngày; không chọn ngày thì là toàn bộ bài của nhóm.

**Độ đủ điểm**:
Số **Bài có điểm** của một học sinh trong **Phạm vi thống kê**. Học sinh **đủ điểm** khi độ đủ điểm bằng số bài trong phạm vi.
_Avoid_: tiến độ, tỷ lệ hoàn thành

**Bài tập**:
Một bài giáo viên giao cho một Nhóm, gắn với một ngày buổi học. Người dùng hay gọi là "bài học" — cùng một thứ.
_Avoid_: bài học, lesson

**Lần nộp**:
Một lần học sinh nộp bài cho một Bài tập. Học sinh có thể nộp nhiều lần; mỗi Lần nộp được chấm riêng.
_Avoid_: bài nộp (khi cần phân biệt các lần)

**Lần nộp chờ chấm**:
Một Lần nộp chưa có kết quả chấm cuối cùng: học sinh vừa nộp, hoặc giáo viên đã mở chấm nhưng chưa chấm xong. Lần nộp đã chấm (kể cả **Chấm không điểm**) không còn là chờ chấm.
_Avoid_: bài chưa chấm, bài pending

**Nhận xét chung**:
Lời nhận xét tổng thể giáo viên viết cho một Lần nộp khi chấm, đi kèm điểm của lần đó. Mỗi Lần nộp có nhiều nhất một Nhận xét chung; chấm lại thì nhận xét mới thay nhận xét cũ.
_Avoid_: bình luận, comment

**Nhận xét theo ảnh**:
Các lời nhận xét giáo viên (hoặc học sinh) gửi trên từng ảnh của một Lần nộp, dạng trao đổi qua lại. Không phải Nhận xét chung.

**Bài bị ẩn**:
Một Bài tập mà giáo viên đã ẩn khỏi giao diện của một học sinh cụ thể: không hiện ở trang chủ và bảng điểm của em đó. Chỉ là ẩn hiển thị, không phải chặn truy cập; bài nộp và điểm vẫn giữ nguyên.
_Avoid_: quyền xem, phân quyền, bị khóa

**Danh sách bài bị ẩn**:
Tập các **Bài bị ẩn** của một học sinh. Học sinh mới có danh sách trống, tức là thấy mọi Bài tập của nhóm, kể cả bài tạo sau này.

**Yêu cầu xem bài bạn**:
Học sinh xin một học sinh khác cho xem bài làm của mình ở một Bài tập; người được xin chấp nhận hoặc từ chối. Không liên quan tới Bài bị ẩn.
_Avoid_: quyền, permission (khi nói chung chung)

## Relationships

- Một **Nhóm** thuộc một **Lớp**; một **Học sinh** thuộc một **Nhóm**
- Một **Bài tập** thuộc một **Nhóm** và gắn với một ngày buổi học
- Mỗi **Học sinh** có một **Danh sách bài bị ẩn**, gồm không hoặc nhiều **Bài tập** thuộc nhóm của em đó
- Một **Học sinh** có không hoặc nhiều **Lần nộp** cho một **Bài tập**; mỗi **Lần nộp** có nhiều nhất một điểm kèm một **Nhận xét chung**, và không hoặc nhiều **Nhận xét theo ảnh**
- Mỗi bài trong **Phạm vi thống kê** là **Bài có điểm** hoặc **Bài thiếu điểm** đối với từng học sinh

## Example dialogue

> **Giáo viên:** "Lọc từ 01/09 đến 15/09 có 5 bài, em A có điểm cả 5 bài, em B mới có 3 bài."
> **Dev:** "Vậy **Độ đủ điểm** của A là 5/5 — A **đủ điểm**, đứng trên B (3/5)."

## Flagged ambiguities

- "Set quyền cho học sinh được xem bài nào" — không phải khái niệm quyền; đã chốt là **Danh sách bài bị ẩn**: mặc định thấy hết, giáo viên chỉ ẩn bớt, để bài mới tự hiện với cả nhóm.
- "Điểm 0 thì không hiển thị" — đã chốt: 0 không phải một điểm số mà là **Chấm không điểm**; bài đó là **Bài thiếu điểm** (trước đây điểm 0 được tính là Bài có điểm).
- "Nhận xét chung với mỗi lần chấm bài" — đã chốt: một nhận xét cho mỗi **Lần nộp**, không lưu lịch sử các lần chấm lại.
- "Có điểm trước" từng được hiểu theo thời gian hoàn thành — đã chốt: chỉ xét số lượng **Bài có điểm**, không xét thời gian.
