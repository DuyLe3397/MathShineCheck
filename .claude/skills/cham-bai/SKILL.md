---
name: cham-bai
description: Chấm bài Toán viết tay trên MathShine từ đề (± đáp án) và đường dẫn chấm bài hoặc Chi tiết bài tập; xuất báo cáo, nhận xét soạn sẵn, tổng hợp lỗi cả lớp và đề xuất buổi chữa để giáo viên duyệt.
disable-model-invocation: true
---

Trợ lý chấm bài cho giáo viên (docs/adr/0007). Chỉ đọc MathShine, không ghi gì lên đó; giáo viên duyệt từng báo cáo rồi tự dán nhận xét và cho điểm. Mọi file nằm trong `cham-bai/` (git bỏ qua vì có tên và bài làm học sinh).

## 0. Đủ đầu vào

Đầu vào từ giáo viên:
- **Đường dẫn** (luôn bắt buộc, một hoặc nhiều):
  - `…/teacher/grade/<mã>` — chấm đúng Lần nộp đó.
  - `…/teacher/assignments/<mã>` — chấm cả lớp: mọi dòng vàng "Đã nộp" (Lần nộp chưa có điểm); dòng xanh "Đã chấm" bỏ qua.
- **Đề** (PDF, ảnh, Word hoặc dán chữ), có thể kèm **đáp án** (chuẩn hoặc chưa chắc). Bắt buộc, trừ khi bài tập của đường dẫn đã có Đáp án đã chốt **trong phiên này** (xem bước 2).

Thiếu đường dẫn, hoặc thiếu đề mà phiên này chưa chốt đáp án nào: hỏi giáo viên đúng phần còn thiếu và **dừng chờ**. Chưa chạy script, chưa giải đề. Đường dẫn sai dạng thì chỉ ra và hỏi lại.

Xong khi: có ít nhất một đường dẫn đúng dạng, và có đề hoặc phiên này đã chốt đáp án.

## 1. Lấy bài

Nhiều đường dẫn thì làm bước 1–4 cho từng đường dẫn, lần lượt.

```
python .claude/skills/cham-bai/scripts/lay_bai.py "<đường dẫn>"
```

Script in JSON: `assignmentDir`, danh sách `todo` (mỗi Lần nộp một thư mục có `goc-<i>.jpg`, `net-<i>.jpg`, `bai-nop.json`, `binh-luan.md` — bình luận của giáo viên và học sinh theo từng ảnh, kèm ảnh đính kèm), `skippedHasReport` (đã có báo cáo từ lần chạy trước, bỏ qua; thêm `--lai` khi giáo viên muốn chấm lại). Lỗi thiếu khóa hoặc API 401: chỉ giáo viên mục **Cài đặt** cuối file. Đường dẫn chấm một bài mà `status` là "Đã chấm" thì báo giáo viên và hỏi có chấm lại không.

Xong khi: có `assignmentDir` và danh sách `todo` (rỗng thì báo giáo viên rồi dừng).

## 2. Chốt đáp án

Kết quả là `<assignmentDir>/dap-an.md` — **đáp án đã chốt**, nguồn duy nhất để chấm mọi bài của bài tập này.

Chọn nhánh theo `assignmentDir` của bước 1:
- **Đã chốt trong phiên này** (giáo viên đồng ý `dap-an.md` của đúng `assignmentDir` này ở một lần chạy trước trong cùng phiên): dùng luôn, không rà soát lại, không hỏi lại — sang bước 3. Giáo viên có gửi kèm đề thì bỏ qua đề đó, trừ khi giáo viên nói chốt lại đáp án.
- **Bài tập khác** với bài đã chốt trong phiên: chưa có đề thì hỏi đề và dừng chờ (bước 0). Có đề thì chốt như dưới.
- **Có `dap-an.md` từ phiên trước**: cho giáo viên xem tóm tắt, hỏi dùng lại hay làm lại. Dùng lại thì coi như đã chốt trong phiên này.
- **Chưa có**: chốt như dưới.

Đọc hết đề (ảnh/PDF bằng thị giác; Word bằng skill docx). Với **từng câu**, tự giải độc lập từ đầu dù đã có đáp án, rồi kiểm lại bằng SymPy (`python -c` / script tạm trong scratchpad) mọi chỗ kiểm được: rút gọn, nghiệm, đạo hàm, tích phân, thay số kiểm tra đẳng thức, thử biên.
- Chỉ có đề: lời giải của Claude là bản đề xuất.
- Đề + đáp án chuẩn: đối chiếu từng câu với lời giải độc lập.
- Đề + đáp án chưa chắc: soát từng bước của đáp án, không chỉ kết quả cuối.

Câu nào lời giải độc lập lệch đáp án, hoặc Claude không chắc (đề mơ hồ, nhiều cách hiểu, SymPy không kiểm được): **dừng**, trình bày cho giáo viên hai cách và chỗ lệch, để giáo viên chốt. Không tự chọn.

**Biểu điểm**: lấy đúng theo đáp án nếu có; không có thì đề xuất điểm cho từng bước (tổng mặc định 10), giáo viên duyệt một lần cho cả bài tập.

`dap-an.md` gồm cho mỗi câu: đề, lời giải chuẩn theo từng bước kèm điểm từng bước, kết quả cuối, các cách giải khác được chấp nhận và lỗi hay gặp dự kiến. Công thức viết dạng `\(…\)`.

Xong khi: giáo viên đã đồng ý đáp án và biểu điểm, và `dap-an.md` đã ghi. Báo giáo viên: từ giờ trong phiên này chỉ cần dán đường dẫn của bài tập này là chấm luôn theo đáp án vừa chốt.

## 3. Chấm từng Lần nộp

Mỗi thư mục trong `todo` giao cho một subagent (Agent tool), **3 bài chạy song song**, xong bài nào giao bài tiếp. Lời giao cho subagent:

> Chấm một Lần nộp theo `.claude/skills/cham-bai/cham-mot-bai.md`. Thư mục bài nộp: `<dir>`. Đáp án đã chốt: `<assignmentDir>/dap-an.md`. Mẫu giọng văn: `cham-bai/giong-van.json`. Ghi `<dir>/bao-cao.md` và `<dir>/loi.json`, trả về điểm đề xuất, các lỗ hổng chính và số chỗ cần giáo viên xem kỹ.

Bị ngắt giữa chừng (hết hạn mức): chạy lại skill với cùng đường dẫn, bước 1 tự bỏ các bài đã có báo cáo.

Xong khi: mọi thư mục trong `todo` có `bao-cao.md` đủ các mục của mẫu báo cáo (kể cả **Đánh giá bạn này**) và `loi.json` hợp lệ, theo `cham-mot-bai.md`. Mở kiểm từng file; thiếu thì giao chấm lại bài đó.

## 4. Tổng hợp lớp

Làm theo `.claude/skills/cham-bai/tong-hop-lop.md`: gộp mọi bài đã chấm của bài tập này (cả các lần chạy trước) thành `<assignmentDir>/tong-hop-lop.md` — đánh giá từng bạn, lỗi chung của lớp, và đề xuất buổi chữa: chữa câu nào, chữa cái gì, ví dụ từ bài làm thật, bài luyện thêm. Chạy cả khi chỉ chấm một bài (ghi rõ dựa trên bao nhiêu bài).

Xong khi: `tong-hop-lop.md` đã viết lại, tính đủ mọi bài trong `<assignmentDir>`.

## 5. Báo giáo viên

Liệt kê từng bài: học sinh, Lần nộp, điểm đề xuất, lỗ hổng chính, số chỗ cần xem kỹ, đường dẫn tới `bao-cao.md` và `gradeUrl`. Sau đó tóm tắt `tong-hop-lop.md`: 3–5 lỗi chung lớn nhất và thứ tự chữa đề xuất, kèm đường dẫn tới file. Nhắc: đây là bản đề xuất, giáo viên duyệt rồi mới dán nhận xét và cho điểm trên MathShine.

## Cài đặt (một lần trên mỗi máy)

- Khóa chấm bài: biến môi trường `MATHSHINE_GRADING_KEY`, hoặc file `~/.mathshine-grading-key` chứa khóa. Server giữ SHA-256 của khóa trong biến Vercel `GRADING_KEY_SHA256` (dự án `mathshine-email-api`).
- Python có `opencv-python`, `numpy`, `sympy`.
