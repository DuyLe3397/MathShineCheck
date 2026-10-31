---
name: cham-bai
description: Chấm bài Toán viết tay trên MathShine. Luôn mở hộp thoại lấy đủ đầu vào (file đề, đáp án, đường dẫn bài nộp, có nhận xét không và kiểu nhận xét), kiểm tra xong là tự chạy đến hết không hỏi thêm; vẽ ✓/✘ lên ảnh bài làm, đăng nhận xét theo ảnh đúng giọng giáo viên, tất cả đẩy thẳng lên MathShine. Dùng khi giáo viên gọi /cham-bai.
disable-model-invocation: true
---

Skill chấm rồi đẩy thẳng lên MathShine, không xuất báo cáo:
- **Ảnh đã chấm**: ✓/✘ đè lên ảnh bài làm (không khoanh chỗ sai); ảnh gốc giữ trên máy để khôi phục.
- **Nhận xét theo ảnh**: bình luận dưới tên giáo viên ra bài.

Điểm do giáo viên tự nhập; skill chỉ báo điểm đề xuất. File nằm trong `cham-bai/` (git bỏ qua). Lỗi khóa hoặc API 401, thiếu thư viện, lỗi mạng, "cần deploy": đọc `<skill>/cai-dat.md`.

Công thức trong chat: `\(…\)` bọc trong backtick, vì trình xem Markdown xóa mất `\` của `\(` đứng trần.

## Tự chạy, không hỏi thêm

Giáo viên chỉ trả lời hộp thoại đầu vào. **Chỉ được hỏi trong bước 0–2** (lấy và kiểm tra đầu vào). Từ bước 3 đến hết không hỏi, không chờ đồng ý, không xin xác nhận: chuyện gì bất thường (đẩy lỗi, chữ không đọc chắc, cần deploy…) ghi vào báo cáo ở bước 4 rồi làm tiếp bài khác.

Các lệnh dưới đây đã được cho phép sẵn trong `.claude/settings.json`, nên không bật hộp thoại xin quyền **nếu gọi đúng dạng**:
- `<skill>` là `.claude/skills/cham-bai`, viết đúng đường dẫn tương đối đó, chạy từ thư mục gốc repo bằng công cụ Bash: `python .claude/skills/cham-bai/scripts/<tên>.py …`. Không `cd`, không đường dẫn tuyệt đối, không `python3`, không PowerShell.
- Chỉ chạy các script trong `<skill>/scripts`. Cần SymPy thì dùng `kiem.py`, không `python -c`. Đọc file Word thì dùng `doc_de.py`, không dùng skill docx hay pandoc.
- Chỉ ghi file trong `cham-bai/`.

Claude Desktop (skill đóng gói): `<skill>` là thư mục chứa file này.

## 0. Đầu vào: luôn hỏi bằng hộp thoại

Mỗi lần skill được gọi, **luôn** lấy đầu vào bằng `AskUserQuestion`, kể cả khi giáo viên đã dán sẵn trong lời gọi hay trong phiên này đã chấm bài tập đó. **Chưa đủ và đúng mọi đầu vào (bốn, hoặc năm nếu có nhận xét) thì chưa chấm.**

**Hộp thoại 1**: bốn câu hỏi trong một lần gọi.

| # | header | Hỏi | Lựa chọn |
|---|---|---|---|
| 1 | `Đề` | Có lấy đề đã chốt trong phiên không? Nếu không: đường dẫn file đề (Word, PDF, ảnh…) | `Dùng đề đã chốt trong phiên (Recommended)` nếu có, cùng các ứng viên (xem dưới) |
| 2 | `Đáp án` | Có lấy đáp án đã chốt trong phiên không? Nếu không: gõ thẳng, hoặc đường dẫn file chứa đáp án | `Dùng đáp án đã chốt trong phiên (Recommended)` nếu có, `Đáp án nằm trong file đề`, cùng các ứng viên |
| 3 | `Bài nộp` | Đường dẫn bài cần chấm trên MathShine | các ứng viên |
| 4 | `Nhận xét` | Có đăng nhận xét kèm không? | `Có nhận xét`, `Không cần nhận xét (chỉ ✓/✘)` |

**Hộp thoại 2**: chỉ khi câu 4 chọn có nhận xét. Một câu hỏi, header `Kiểu nhận xét`, lựa chọn `Chỉ ra chỗ sai rồi gợi ý`, `Chỉ ra chỗ sai thôi`.

**Đã chốt trong phiên**: trong phiên này đã chốt `dap-an.md` (bước 2) thì câu 1 và câu 2 đều có lựa chọn này, đặt **đầu tiên**:
- câu 1: label `Dùng đề đã chốt trong phiên (Recommended)`, description là đường dẫn đầy đủ file đề đã dùng;
- câu 2: label `Dùng đáp án đã chốt trong phiên (Recommended)`, description là đường dẫn `dap-an.md` đã chốt.

Phiên này chưa chốt gì thì không có hai lựa chọn này.

**Ứng viên** cho câu 1–3 (tối đa 4 lựa chọn tính cả lựa chọn trên, giáo viên luôn gõ được giá trị khác ở ô "Other"):
- giá trị giáo viên đã dán trong lời gọi, label `Dùng: <tên file hoặc mã ngắn>`, đường dẫn đầy đủ trong description;
- câu 3: đường dẫn đã dùng trong phiên này;
- câu 1, 2: file đề hay đáp án mới nhất tìm bằng Glob (`*.docx`, `*.pdf`, `*.png`, `*.jpg`) trong thư mục làm việc và `~/Downloads`.

Thiếu ứng viên để đủ hai lựa chọn thì thêm `Tôi gõ ở ô Other`, description "Chọn Other rồi dán vào". Giáo viên chọn đúng lựa chọn này mà không gõ gì thì coi như còn thiếu.

**Kiểm tra** ngay khi có câu trả lời, bằng chính bước 1 và 2:
- **Bài nộp**: một hoặc nhiều đường dẫn, mỗi cái đúng một trong hai dạng:
  - `…/teacher/grade/<mã>` (trang ảnh bài làm của một Lần nộp): chấm luôn bài đó, bất kể trạng thái;
  - `…/teacher/assignments/<mã>` (danh sách bài tập): chỉ chấm các dòng **vàng "Đã nộp"**; dòng xanh "Đã chấm" bỏ qua.

  Đúng dạng thì chạy luôn bước 1. Script báo lỗi đường dẫn hay không tìm thấy bài thì câu 3 sai; báo thiếu khóa hay 401 thì làm theo `cai-dat.md`.
- **Đề**: đọc được (bước 2). Chọn đề đã chốt thì vẫn kiểm tra file đó còn.
- **Đáp án**: đọc ra được đáp án **từng câu** của đề (bước 2). Chọn đáp án đã chốt thì `dap-an.md` đó phải còn. `Đáp án nằm trong file đề` mà đề không có đáp án thì coi là thiếu.

Câu nào thiếu hoặc sai thì mở lại hộp thoại **chỉ với các câu đó**, ghi rõ lý do trong câu hỏi (vd. "Không tìm thấy file D:\…\de.docx, kiểm tra lại đường dẫn", "Đáp án thiếu câu 7 và 9b, gõ đáp án hai câu này"), rồi **dừng chờ**. Đủ và đúng hết thì nhắc lại một dòng (đề, đáp án, số bài cần chấm, chế độ nhận xét) rồi sang bước 3 luôn, không hỏi xác nhận thêm.

Không có `AskUserQuestion` (vd. Claude Desktop): hỏi các mục trong một tin nhắn đánh số, kiểm tra như trên, thiếu hay sai thì hỏi lại đúng mục đó.

**Chế độ nhận xét** truyền cho người chấm: `gợi ý` (chỉ ra chỗ sai, thêm gợi ý hướng đi đúng), `chỉ chỗ sai`, hoặc `không`. Ở mọi chế độ, chỉ câu sai mới được nhận xét; các câu sai chỉ ghi đáp số được gộp vào một đoạn "cần xem lại" duy nhất, chế độ `gợi ý` thêm một gợi ý ngắn cho từng câu (chi tiết trong `cham-mot-bai.md`).

## 1. Lấy bài

Nhiều đường dẫn thì làm bước 1–3 cho từng đường dẫn.

Chạy `python .claude/skills/cham-bai/scripts/lay_bai.py "<đường dẫn>"`. Script in JSON gồm:
- `assignmentDir`;
- `todo`: mỗi bài có `dir` và `files`;
- `dayLai`: bài đã chấm nhưng đẩy lên chưa xong. Chỉ cần chạy `python .claude/skills/cham-bai/scripts/day_len.py <dir> …`, không chấm lại;
- `skippedDone`: số bài đã xong, bị bỏ qua (`--lai` để chấm lại).

Script tự lọc theo trạng thái: link danh sách chỉ lấy dòng vàng "Đã nộp" (bỏ cả bài skill đã đẩy xong mà giáo viên chưa nhập điểm); link chấm một bài thì luôn có trong `todo`, kể cả đã chấm trước đó (ảnh lấy lại từ bản gốc, bình luận cũ được sửa tại chỗ, không đăng trùng). Không lọc thêm. `todo` và `dayLai` đều rỗng thì báo rồi dừng; chỉ `todo` rỗng thì bỏ qua bước 2–3.

## 2. Chốt đáp án → `<assignmentDir>/dap-an.md`

Luôn dựa trên đề và đáp án vừa nhận ở bước 0.
- **Câu 2 chọn `Dùng đáp án đã chốt trong phiên`**: dùng luôn `dap-an.md` đó, không đọc lại đề hay đáp án. Khác `assignmentDir` thì chép sang `<assignmentDir>/dap-an.md`.
- **Đã chốt trong phiên này từ đúng đề và đáp án đó**: dùng luôn, không đọc lại.
- **Có `dap-an.md` từ phiên trước**: đối chiếu với đáp án vừa nhận; khớp thì dùng lại, lệch thì ghi lại theo đáp án vừa nhận.
- **Chưa có**: đọc đề và đáp án.
  - **Word**: `python .claude/skills/cham-bai/scripts/doc_de.py "<file>"`, rồi đọc song song `de.md` script in ra và các ảnh `anh-<n>.png` nó trỏ tới (hình vẽ, công thức MathType). Script báo không đổi được ảnh mà ảnh đó cần để hiểu đề thì coi là đề chưa đọc được.
  - **PDF, ảnh**: đọc thẳng bằng Read.
  - Đáp án dùng nguyên, **không** giải lại. Thiếu câu hoặc không đọc được câu nào thì hỏi lại theo bước 0.
  - **Biểu điểm**: theo đáp án. Không có thì tự định điểm từng câu, và từng bước với câu tự luận (thang 10), không chờ giáo viên duyệt; báo lại ở bước 4.

`dap-an.md` được mọi người chấm đọc, nên càng gọn càng rẻ:
- **Trắc nghiệm, đúng/sai, trả lời ngắn**: một bảng `| Câu | Đáp án | Điểm |`, không chép đề.
- **Tự luận**: mỗi câu gồm đề rút gọn một dòng, kết quả cuối (kèm dạng tương đương được chấp nhận), điểm. Đáp án có lời giải thì thêm các bước, mỗi bước một dòng kèm điểm.
- **Công thức**: LaTeX chuẩn trong `\(…\)` như quy định công thức của MathShine (người chấm chép từ đây vào nhận xét): `\(x^{2}\)`, `\(\frac{1}{2}\)`, `\(\sqrt{3}\)`, `\(\widehat{ABC}=60^{\circ}\)`. Không viết kiểu máy tính (`x^2`, `sqrt(3)`, `1/2`) hay ký hiệu Unicode thay lệnh (`°`, `≤`, `π`).

Ghi file xong thì chạy `python .claude/skills/cham-bai/scripts/chuan_hoa.py <assignmentDir>/dap-an.md` rồi sang bước 3 luôn.

## 3. Chấm và đẩy lên

Mỗi `dir` giao cho một subagent loại **`cham-bai`** (Sonnet, đã có sẵn hướng dẫn chấm). Chạy **3 bài song song**, xong bài nào giao bài tiếp, đến hết danh sách. Lời giao đúng như sau (`<files>` nối bằng dấu phẩy):

> Chấm một Lần nộp. Chế độ nhận xét: `<gợi ý | chỉ chỗ sai | không>`. Thư mục: `<dir>`. Lượt đầu đọc song song: `<assignmentDir>/dap-an.md`, `cham-bai/giong-van.md` và trong thư mục: `<files>`.

Chế độ `không` thì bỏ `cham-bai/giong-van.md` khỏi danh sách đọc.

Không có loại `cham-bai`: dùng subagent mặc định với `model: "sonnet"`, và thêm `<skill>/cham-mot-bai.md` vào đầu danh sách đọc. Không có Agent tool (vd. Claude Desktop): tự chấm lần lượt theo `<skill>/cham-mot-bai.md`.

Một bài lỗi (người chấm báo lỗi, không trả về dòng kết quả) thì ghi vào báo cáo rồi giao bài tiếp, không dừng cả lượt. Bị ngắt giữa chừng thì chạy lại với cùng đường dẫn; bài đã chấm được bỏ qua.

## 4. Báo giáo viên

Mỗi bài một dòng, lấy từ dòng người chấm trả về:

`học sinh — Lần nộp — điểm đề xuất — ✓/✘ — đẩy ảnh, bình luận (lỗi thì lý do) — cần xem — gradeUrl`

Cuối cùng nhắc giáo viên:
- dấu (và bình luận, nếu có chọn nhận xét) đã lên MathShine;
- điểm thì giáo viên tự nhập;
- biểu điểm do skill tự định (nếu đáp án không có điểm);
- muốn trả lại ảnh gốc: `python .claude/skills/cham-bai/scripts/day_anh.py <dir> --khoi-phuc`.
