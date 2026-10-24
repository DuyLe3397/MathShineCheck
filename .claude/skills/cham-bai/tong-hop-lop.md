# Tổng hợp lớp và đề xuất buổi chữa

Dành cho bước 4 của `/cham-bai`. Đầu vào: mọi `<assignmentDir>/*/loi.json` và `bao-cao.md` đã có (kể cả của các lần chạy trước), cùng `<assignmentDir>/dap-an.md`. Kết quả: `<assignmentDir>/tong-hop-lop.md`, viết lại toàn bộ mỗi lần chạy. Chỉ giáo viên đọc.

## 1. Gộp số liệu

Đọc hết các `loi.json`. Lần nộp chưa có `loi.json` (báo cáo cũ) thì đọc mục Lỗi từng câu và Đánh giá bạn này trong `bao-cao.md` của bài đó. Một học sinh có nhiều Lần nộp thì tính theo Lần nộp mới nhất.

Tính:
- số bài, điểm trung bình, cao nhất, thấp nhất, phân bố điểm;
- mỗi câu: điểm trung bình / tối đa, số bạn làm đúng hoàn toàn, sai, bỏ trống;
- mỗi **lỗ hổng** (`loHong`): bao nhiêu bạn mắc, là bạn nào, ở câu nào, thuộc nhóm kiến thức / cẩn thận / trình bày. Tên gần nghĩa mà khác chữ thì gộp làm một và ghi rõ đã gộp.

Xong khi: mọi Lần nộp trong `<assignmentDir>` đã được tính, không bỏ sót bài nào.

## 2. Đề xuất buổi chữa

Xếp ưu tiên chữa trên lớp:
1. Lỗ hổng **kiến thức** nhiều bạn mắc (từ khoảng 1/4 lớp trở lên) — chữa kỹ, có giảng lại.
2. Câu điểm trung bình thấp hoặc nhiều bạn bỏ trống — chữa lời giải mẫu.
3. Lỗi **cẩn thận** / **trình bày** lặp ở nhiều bạn — nhắc nhanh, chỉ ví dụ.
4. Lỗi chỉ một hai bạn mắc — không chữa chung, để nhận xét riêng hoặc kèm riêng.

Với mỗi mục chữa: chữa câu nào, chữa cái gì (điểm then chốt, bước hay sai, cách trình bày đúng), một ví dụ tiêu biểu lấy từ bài làm thật (bạn nào, Ảnh i dòng k — để giáo viên chiếu hoặc chép lên bảng), thời lượng ước tính, và **1–2 bài luyện thêm** cùng dạng do Claude soạn (có đáp số, đã kiểm bằng SymPy). Câu hầu hết lớp làm đúng: ghi "không cần chữa".

Xong khi: mọi lỗ hổng từ khoảng 1/4 lớp trở lên và mọi câu điểm trung bình dưới một nửa đều có mục chữa hoặc lý do không chữa.

## Mẫu

```markdown
# Tổng hợp lớp — <Bài tập>

Dựa trên <N> bài (cập nhật <ngày giờ>). Bản đề xuất, giáo viên duyệt.

## Tổng quan

Điểm trung bình <x>/<tổng> · cao nhất <…> · thấp nhất <…>
Phân bố: <khoảng điểm: số bạn>

| Câu | TB / tối đa | Đúng hết | Sai | Bỏ trống |
|---|---|---|---|---|

## Đánh giá từng bạn

| Học sinh | Điểm | Lỗ hổng chính | Cần ôn | Báo cáo |
|---|---|---|---|---|

## Lỗi chung

### <lỗ hổng> — <số bạn>/<N> bạn — *<kiến thức | cẩn thận | trình bày>*
- Ở câu: …
- Các bạn: …
- Ví dụ: <bạn>, Ảnh i dòng k: `<dòng sai>`

## Đề xuất buổi chữa (khoảng <tổng phút> phút)

### 1. <Chữa câu … / lỗ hổng …> — <phút> phút
- **Chữa gì:** …
- **Ví dụ trên bảng:** …
- **Luyện thêm:** 1) … (Đáp số: …)  2) …

### Không cần chữa chung
- Câu …: <số bạn> đúng hết.

### Kèm riêng
- <bạn>: <lỗ hổng riêng, gợi ý>
```
