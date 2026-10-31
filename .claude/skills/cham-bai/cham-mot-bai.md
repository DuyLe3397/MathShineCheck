# Chấm một Lần nộp

Lời giao cho: thư mục `<dir>`, `dap-an.md` (Đáp án đã chốt, biểu điểm), `giong-van.md` (nhận xét thật của giáo viên), các file của bài (`goc-<i>.jpg`; có thể có `binh-luan.md`, `dinh-kem-*.jpg`), và **chế độ nhận xét** (không ghi thì là `gợi ý`):
- `gợi ý`: chỉ ra chỗ sai, thêm gợi ý hướng đi đúng;
- `chỉ chỗ sai`: chỉ ra chỗ sai thôi;
- `không`: không nhận xét gì, chỉ vẽ ✓/✘.

`<skill>` = `.claude/skills/cham-bai`.

Claude chỉ viết `<dir>/cham.md` (mẫu cuối file). Script vẽ, cộng điểm, đẩy ảnh, đăng bình luận.

Chạy một mạch không hỏi ai: chỗ không chắc đưa vào "cần xem", lỗi thì ghi vào dòng trả về. Lệnh đã được cho phép sẵn nếu gọi đúng dạng `python .claude/skills/cham-bai/scripts/<tên>.py …` bằng công cụ Bash, từ thư mục gốc repo: không `cd`, không đường dẫn tuyệt đối tới script, không `python -c`.

Lượt đầu đọc song song mọi file lời giao liệt kê. Mỗi ảnh đọc một lần. Không `ls`, không đọc lại file vừa ghi.

## 1. Chấm

- **`binh-luan.md`** là ngữ cảnh (ảnh nào là câu nào, phần làm lại, giáo viên đã dặn gì). Căn cứ chấm vẫn là ảnh và đáp án. Không lặp ý giáo viên đã nói.
- **Tìm đáp số** từng câu/ý: đáp số cuối hoặc đáp án khoanh, theo nhãn học sinh viết. Bài có thể không theo thứ tự hoặc vắt qua hai ảnh; dòng gạch bỏ không tính. Không thấy thì là bỏ trống.
- **Khớp** kết quả cuối trong `dap-an.md` (tương đương về toán cũng là khớp: \(\frac{1}{2}=0{,}5\), nghiệm khác thứ tự…) → **✓**, đủ điểm. Dừng ở đó: không đọc lời giải, không phân tích, không nhận xét câu này.
- **Không khớp → ✘**, chia hai loại:
  - **Chỉ ghi đáp số** (trắc nghiệm, đúng/sai, trả lời ngắn, hoặc tự luận mà chỉ ghi kết quả, không trình bày): không phân tích, điểm 0.
  - **Có trình bày mà kết quả sai**: đọc lời giải, tìm **bước sai đầu tiên** theo các bước của đáp án; học sinh giải cách khác thì tự giải theo cách đó. SymPy chỉ dùng cho bước nhẩm không chắc, gộp vào một lần chạy `python <skill>/scripts/kiem.py "<A> == <B>" "giai: <pt>, x" …` (`A == B` so hai vế, `giai: A = B, x` giải, chỉ `A` thì rút gọn; `^` là lũy thừa, `2x` là `2*x`). Điểm theo biểu điểm: các bước đúng trước chỗ sai được điểm.
- **Chữ không đọc chắc** mà ảnh hưởng tới điểm: không đoán. Đưa vào "cần xem" của dòng trả về, và (trừ chế độ `không`) trong bình luận nhờ học sinh viết rõ.

## 2. `cham.md`

**Bảng**: mọi câu/ý một dòng.
- **Vị trí**: `ảnh (x; y)` — ngay bên phải đáp số hoặc đáp án khoanh, ở chỗ trống không đè chữ. `x`, `y` là tỉ lệ 0–1 theo ngang và dọc, gốc ở góc trên bên trái.
- **Điểm**: câu ✓ và câu bỏ trống để trống ô Điểm, script tự điền. Câu bỏ trống ghi `—` ở cột Đ/S và Vị trí.

**Chế độ `không`**: dòng đầu file ghi `Bình luận: không`, chỉ có bảng, không có mục `## Ảnh`. Bỏ qua phần nhận xét dưới đây.

**Nhận xét** `## Ảnh <i>`: mỗi đoạn được đăng thẳng thành một bình luận của giáo viên dưới ảnh, học sinh đọc ngay. Viết **y như giáo viên viết tay**, không làm hộ.
- **Chỉ nhận xét câu ✘.** Câu ✓ chỉ có dấu tích: không khen, không nhắc tới, không ghi nhận phần đúng. Ảnh không có câu ✘ thì không có mục (trừ ảnh trùng, mờ, nháp: một câu nhắc).
- **Câu ✘ chỉ ghi đáp số**: gộp **tất cả** vào **một đoạn duy nhất cho cả bài**, đặt dưới ảnh có câu đầu tiên trong số đó: liệt kê tên từng câu rồi bảo cần xem lại, đúng một lần. Không phân tích bài làm, không nói đáp án đúng.
  - `chỉ chỗ sai`: chỉ có vậy. Vd. "Câu 2, câu 5 và câu 9b em cần xem lại nha"
  - `gợi ý`: vẫn một đoạn đó, sau câu "cần xem lại" thêm cho **từng câu** một gợi ý ngắn (nửa câu văn) về hướng làm, dựa vào đề và đáp án: quy tắc, công thức, điều kiện cần nhớ, hoặc cách tự kiểm. Vd. "Câu 2, câu 5 và câu 9b em cần xem lại nha: câu 2 em nhớ điều kiện để căn có nghĩa, câu 5 xét lại dấu của hệ số \(a\), câu 9b thay nghiệm vào phương trình kiểm lại nhé"
- **Câu ✘ có trình bày**: mỗi câu một đoạn (cách nhau một dòng trống), dưới ảnh có câu đó, mở đầu "Câu <n>". Nội dung theo chế độ:
  - `chỉ chỗ sai` (một đến hai câu văn): trích ngắn chỗ học sinh viết sai ("chỗ em ghi …", "dòng thứ hai"), nói ngắn chỗ đó sai kiểu gì ("bị sai dấu", "thiếu điều kiện", "nhầm công thức"), rồi bảo em xem lại. **Không** gợi cách sửa, không viết dòng đúng, không nói kết quả. Ảnh không có vòng khoanh, nên đừng viết "chỗ khoanh đỏ".
  - `gợi ý` (tối đa ba câu văn): y như `chỉ chỗ sai`, **thêm** gợi ý hướng đi đúng: dùng quy tắc, công thức hay điều kiện nào, nên làm lại từ bước nào theo hướng nào (với lỗi kiến thức, lập luận thì có thể hỏi dẫn một câu). **Không** viết hộ dòng đúng, không nói kết quả.
- **Lỗi kéo theo**: chỉ nói ở bước sai đầu tiên, thêm rằng các dòng sau cũng phải làm lại.
- **Giọng**: bám `giong-van.md`: xưng hô, cách mở đầu ("Câu 7 em …"), từ cuối câu ("nha", "nhé", "đó"), độ dài. Viết liền thành đoạn, **cuối đoạn không đặt dấu chấm** (như người gõ bình luận): không gạch đầu dòng, không in đậm, không dùng từ mẫu không có ("Tuyệt vời!", "Hãy…", "Bạn…").
- **Không dùng dấu gạch** (`-`, `–`, `—`) trong nhận xét, kể cả để nối ý hay chèn ý: đọc rất giống máy viết. Thay bằng dấu phẩy, dấu hai chấm, hoặc tách thành câu khác. Dấu trừ của phép tính thì nằm trong `\(…\)`. Script báo **THIẾU** nếu còn dấu gạch ngoài công thức, hoặc có câu ✘ chưa được nhắc tên trong nhận xét.
- **Công thức**: mọi biểu thức toán (kể cả một chữ cái, một số có dấu trừ) đều là LaTeX chuẩn trong `\(…\)` để MathShine vẽ được: `\(x^{2}\)`, `\(\frac{1}{2}\)`, `\(\sqrt{3}\)`, `\(\widehat{ABC}=60^{\circ}\)`, `\(x\le 2\)`. Viết `$…$` cũng được, script tự đổi. **Không** viết công thức trần ngoài `\(…\)`, không dùng cách viết của `kiem.py` (`x^2`, `2x`, `sqrt(3)`, `1/2`) hay ký hiệu Unicode thay lệnh (`°`, `≤`, `√`, `π`).
- **Ví dụ `chỉ chỗ sai`**: "Câu 4 chỗ em ghi \(S=\frac{1}{2}ab\cos C\) bị nhầm công thức rồi, em xem lại chỗ này nha"
- **Ví dụ `gợi ý`**: "Câu 4 chỗ em ghi \(S=\frac{1}{2}ab\cos C\) bị nhầm công thức rồi nha: diện tích theo hai cạnh và góc xen giữa thì góc đi với hàm lượng giác nào? Em làm lại từ dòng này, các dòng sau cũng đổi theo nhé"

## 3. Vẽ, soát, đẩy

1. Cùng một lượt: ghi `cham.md`, rồi chạy `python <skill>/scripts/danh_dau.py <dir>`. Báo **THIẾU** thì sửa đúng chỗ được báo và chạy lại.
2. Báo **OK**: đọc một lần các tấm ghép `xem-*.jpg`. Soát mỗi ✓/✘ nằm cạnh đúng đáp số của câu đó.
3. Cùng một lượt:
   - (nếu có dấu lệch) sửa `cham.md`;
   - chạy `python <skill>/scripts/danh_dau.py <dir> && python <skill>/scripts/day_len.py <dir>`.

   Không soát lại. Chỗ vẫn không chắc thì đưa vào "cần xem". Đẩy hoặc đăng báo lỗi thì không thử lại.

Trả về đúng một dòng:

`<điểm script in> · <a> ✓ <b> ✘ · đẩy <n> ảnh · <c> bình luận · cần xem: <chỗ, hoặc "không">`

Có lỗi khi đẩy ảnh hay đăng bình luận thì thêm lý do ngắn.

## Mẫu `cham.md`

```markdown
| Câu | Đ/S | Điểm | Tối đa | Vị trí |
|---|---|---|---|---|
| 1 | ✓ | | 0,25 | 1 (0.55; 0.12) |
| 2 | ✘ | 0 | 0,25 | 1 (0.60; 0.20) |
| 7 | ✘ | 0 | 0,25 | 1 (0.60; 0.40) |
| 8 | — | | 0,25 | — |
| 9a | ✘ | 0,5 | 1 | 2 (0.70; 0.35) |
| 9b | ✘ | 0 | 1 | 2 (0.70; 0.80) |

## Ảnh 1
Câu 2, câu 7 và câu 9b em cần xem lại nha

## Ảnh 2
Câu 9a <đoạn chỉ chỗ sai, thêm gợi ý nếu chế độ `gợi ý`>
```

Ở mẫu: câu 2, 7, 9b chỉ ghi đáp số nên gộp một đoạn dưới ảnh 1 (ảnh có câu đầu tiên trong số đó); câu 9a có trình bày nên có đoạn riêng; câu 1 ✓ không được nhắc.

Chế độ `không`: thêm dòng `Bình luận: không` lên đầu, rồi chỉ có bảng.
