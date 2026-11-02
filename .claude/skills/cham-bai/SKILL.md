---
name: cham-bai
description: Chấm bài Toán viết tay trên MathShine. Luôn mở hộp thoại lấy đủ đầu vào (file đề, đáp án, đường dẫn bài nộp, đã xoay ảnh dọc chưa, có nhận xét không và kiểu nhận xét), kiểm tra xong là tự chạy đến hết không hỏi thêm; vẽ ✓/✘ lên ảnh bài làm, đăng nhận xét theo ảnh đúng giọng giáo viên, tất cả đẩy thẳng lên MathShine. Lần nộp 1 thì báo câu nào của đề còn chưa làm; lần 2 trở đi thì so với kết quả đã lưu của các lần trước để báo lỗi nào đã sửa, chưa sửa, câu nào còn thiếu. Dùng khi giáo viên gọi /cham-bai.
disable-model-invocation: true
---

Chấm rồi đẩy thẳng lên MathShine: ✓/✘ đè lên ảnh bài làm (ảnh gốc giữ trên máy), nhận xét theo ảnh dưới tên giáo viên ra bài. Điểm giáo viên tự nhập, skill chỉ đề xuất. Lần nộp 2 trở đi được so với `cham.md` đã lưu của các lần trước, không chấm lại lần nào; script tự so và tự nhắc học sinh câu chưa làm.

**Giữ ngữ cảnh nhỏ**: bạn chỉ điều phối. Không tự đọc đề, đáp án, ảnh bài làm hay `dap-an.md`; việc đó của người làm ở bước 2, 3.

**Không hỏi sau bước 2**: chỉ hỏi khi lấy và kiểm tra đầu vào. Từ bước 3 chuyện bất thường ghi vào báo cáo bước 4 rồi làm tiếp.

**Lệnh** (đã cho phép sẵn nếu gọi đúng dạng): `python .claude/skills/cham-bai/scripts/<tên>.py …` bằng Bash, từ gốc repo; không `cd`, không đường dẫn tuyệt đối, không `python3`, không PowerShell, không `python -c`. Chỉ ghi file trong `cham-bai/`. Lỗi khóa, 401, thiếu thư viện, lỗi mạng, "cần deploy": đọc `.claude/skills/cham-bai/cai-dat.md`. Claude Desktop: `<skill>` là thư mục chứa file này.

Công thức trong chat: `\(…\)` bọc trong backtick.

## 0. Đầu vào: luôn hỏi bằng hộp thoại

Mỗi lần gọi đều hỏi bằng `AskUserQuestion`, kể cả khi đã dán sẵn. Chưa đủ và đúng mọi đầu vào thì chưa chấm.

Lấy ứng viên file: `python .claude/skills/cham-bai/scripts/ung_vien.py` (in 4 file đề, đáp án mới nhất). Không dùng Glob.

**Hộp thoại 1** (một lần gọi):

| header | Hỏi | Lựa chọn |
|---|---|---|
| `Đề` | File đề (Word, PDF, ảnh…) | `Dùng đề đã chốt trong phiên (Recommended)` nếu có, rồi ứng viên |
| `Đáp án` | Gõ thẳng, hoặc file chứa đáp án | `Dùng đáp án đã chốt trong phiên (Recommended)` nếu có, `Đáp án nằm trong file đề`, ứng viên |
| `Bài nộp` | Đường dẫn bài cần chấm trên MathShine | đường dẫn đã dán hoặc đã dùng trong phiên |
| `Nhận xét` | Có đăng nhận xét kèm không? | `Có nhận xét`, `Không cần nhận xét (chỉ ✓/✘)` |

**Hộp thoại 2** (luôn hỏi, ngay sau):

| header | Hỏi | Lựa chọn |
|---|---|---|
| `Xoay ảnh` | Bạn đã xoay toàn bộ ảnh bài làm đúng chiều dọc chưa? Không ảnh nào nằm ngang? | `Đã xoay hết, không ảnh nào nằm ngang`, `Chưa, tôi đi xoay rồi chạy tiếp` |
| `Kiểu nhận xét` | Chỉ khi có nhận xét: kiểu nào? | `Chỉ ra chỗ sai rồi gợi ý`, `Chỉ ra chỗ sai thôi` |

- "Đã chốt trong phiên": chỉ có khi phiên này đã chốt `dap-an.md`; description là đường dẫn file đề và `dap-an.md` đã dùng.
- Ứng viên: label `Dùng: <tên ngắn>`, đường dẫn đầy đủ ở description, tối đa 4 lựa chọn. Thiếu thì thêm `Tôi gõ ở ô Other`; chọn nó mà không gõ thì coi là thiếu.
- Chưa chọn `Đã xoay hết…` thì không chạy bước 1 (sẽ tải ảnh nằm ngang): nhắn giáo viên xoay trên MathShine, mở lại chỉ câu xoay ảnh, dừng chờ.
- Không có `AskUserQuestion` (Claude Desktop): hỏi trong một tin nhắn đánh số.

**Kiểm tra** bằng chính bước 1 và 2:
- Bài nộp: mỗi đường dẫn có dạng `…/teacher/grade/<mã>` (một Lần nộp, chấm luôn bất kể trạng thái) hoặc `…/teacher/assignments/<mã>` (chỉ chấm dòng vàng "Đã nộp"). `lay_bai.py` báo lỗi đường dẫn thì câu này sai.
- Đề, đáp án: bước 2 trả `OK`. Chọn đã chốt thì file đó phải còn.

Câu nào thiếu hoặc sai thì hỏi lại **chỉ câu đó**, nêu lý do trong câu hỏi (vd. "Đáp án thiếu câu 7 và 9b, gõ đáp án hai câu này"), rồi dừng chờ. Đủ hết thì nhắc lại một dòng (đề, đáp án, số bài, ảnh đã xoay, chế độ nhận xét) rồi chạy tiếp, không xin xác nhận.

Chế độ nhận xét truyền cho người chấm: `gợi ý`, `chỉ chỗ sai` hoặc `không`.

## 1. Lấy bài

Mỗi đường dẫn: `python .claude/skills/cham-bai/scripts/lay_bai.py "<đường dẫn>"`. JSON in ra:
- `assignmentDir`;
- `todo`: mỗi bài có `dir`, `files`, `student`, `attempt` (Lần nộp thứ mấy);
- `dayLai`: bài đã chấm mà đẩy chưa xong, chỉ chạy `day_len.py <dir> …`, không chấm lại;
- `skippedDone`: số bài đã xong.

Script đã lọc theo trạng thái, không lọc thêm. `todo` và `dayLai` đều rỗng thì báo rồi dừng; `todo` rỗng thì bỏ bước 2, 3. Các Lần nộp đã chấm trước đó vẫn nằm trong `assignmentDir` làm lịch sử.

## 2. Chốt đáp án: `<assignmentDir>/dap-an.md`

- Chọn `Dùng đáp án đã chốt trong phiên`: dùng luôn; khác `assignmentDir` thì chép sang `<assignmentDir>/dap-an.md`.
- Còn lại: giao một subagent loại **`chot-dap-an`**:

  > Chốt đáp án. Đề: `<file đề>`. Đáp án: `<file | trong file đề | "chữ giáo viên gõ">`. assignmentDir: `<assignmentDir>`. `<Đã có dap-an.md cũ | Chưa có dap-an.md>`.

  Không có loại này: subagent mặc định `model: "sonnet"`, thêm "Đọc trước `.claude/skills/cham-bai/chot-dap-an.md`". Không có Agent tool: tự làm theo file đó.
- Trả `THIẾU · …`: hỏi giáo viên đúng các câu đó (bước 0); có câu trả lời thì tự sửa các dòng `?` trong `dap-an.md` bằng Edit. Trả `LỖI · …`: hỏi lại file đó.

## 3. Chấm và đẩy

Mỗi `dir` giao một subagent loại **`cham-bai`**, 3 bài song song, xong bài nào giao bài tiếp. Cùng học sinh có nhiều Lần nộp thì giao theo `attempt` tăng dần, lần sau chỉ giao khi lần trước xong. Lời giao (`<files>` nối bằng dấu phẩy; chế độ `không` thì bỏ `giong-van.md`):

> Chấm một Lần nộp. Lần nộp thứ `<attempt>`. Chế độ nhận xét: `<gợi ý | chỉ chỗ sai | không>`. Thư mục: `<dir>`. Lượt đầu đọc song song: `<assignmentDir>/dap-an.md`, `cham-bai/giong-van.md` và trong thư mục: `<files>`.

Không đưa kết quả lần trước vào lời giao. Không có loại `cham-bai`: subagent mặc định `model: "sonnet"`, thêm `.claude/skills/cham-bai/cham-mot-bai.md` vào đầu danh sách đọc. Không có Agent tool: tự chấm theo file đó. Một bài lỗi thì ghi vào báo cáo, làm tiếp. Bị ngắt thì chạy lại cùng đường dẫn; bài đã chấm được bỏ qua.

## 4. Báo giáo viên

Mỗi bài một dòng từ dòng người chấm trả về:

`học sinh — Lần nộp — điểm đề xuất — ✓/✘ — đẩy ảnh, bình luận (lỗi thì lý do) — cần xem — gradeUrl`

Dưới mỗi dòng, thụt vào, phần `Lịch sử` (nhãn viết dễ đọc): lần 1 thì `còn thiếu`; lần 2 trở đi thì `đã sửa`, `chưa sửa`, `chưa làm lại`, `mới sai`, `còn thiếu` và lần nào không so được. Bài `dayLai` không có lịch sử.

Cuối cùng nhắc: dấu (và nhận xét nếu có) đã lên MathShine; điểm giáo viên tự nhập; biểu điểm do skill tự định (nếu bước 2 báo vậy); trả ảnh gốc: `python .claude/skills/cham-bai/scripts/day_anh.py <dir> --khoi-phuc`.
