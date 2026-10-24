# 0005: Bàn phím toán chèn ký tự Unicode thay vì LaTeX/KaTeX

> **Đã bị thay bởi [ADR 0006](0006-cong-thuc-kieu-casio-mathlive-katex.md).** Bàn phím Unicode không còn dùng. Mọi ký hiệu và công thức được soạn bằng MathLive và hiển thị bằng KaTeX.

## Context

Phần lớn bài tập là Toán 10–12, nên giáo viên và học sinh cần viết ký hiệu toán trong Nhận xét theo ảnh, Nhận xét chung, Ghi chú ảnh, thảo luận và Mô tả bài tập. Hiện mọi ô này là `<textarea>`/`<input>` văn bản thuần, hiển thị bằng nội suy Angular với `white-space: pre-wrap`, và Email thông báo gửi đi toàn văn nội dung. Học sinh chủ yếu dùng điện thoại.

Có ba hướng đã cân nhắc:

1. **Chèn ký tự Unicode** (√ π ≤ ∈ ℝ ∫ x² uₙ …) vào chỗ con trỏ.
2. **LaTeX + KaTeX**: chèn mẫu `\frac{}{}`, `\sqrt{}`… rồi dựng hình công thức khi hiển thị.
3. **Trình soạn trực quan (MathLive)**: ô nhập công thức kiểu WYSIWYG.

## Decision

Chọn hướng 1. Bàn phím toán chỉ chèn ký tự Unicode, nên nội dung lưu trên Firestore vẫn là chữ thường. Biểu thức cấu trúc (phân số, căn của biểu thức, giới hạn, tích phân) được viết trên một dòng qua các Mẫu ký hiệu như `(…)/(…)`, `√(…)`, `lim(x→…)`. Vectơ viết dạng chữ "vt AB" chứ không dùng ký tự kết hợp mũi tên U+20D7, vì chỗ này nhiều font Android vẽ lệch. Số mũ và chỉ số dưới dùng các ký tự mũ/chỉ số có sẵn trong Unicode; ký tự nào không có dạng đó thì giữ nguyên.

## Consequences

- Không phải đổi mô hình dữ liệu, cách hiển thị, Thông báo hay Email thông báo: ký hiệu toán đi qua mọi nơi như chữ gõ tay.
- Không thêm thư viện dựng hình công thức (~300KB với KaTeX, ~700KB+ với MathLive), trang vẫn nhẹ trên điện thoại.
- Học sinh không phải đọc hay hiểu mã LaTeX khi gõ.
- Phân số, hệ phương trình, ma trận và cận tích phân không hiển thị như viết tay mà chỉ viết được trên một dòng. Muốn có công thức dựng hình thì phải có ADR mới. Khi đó nội dung Unicode cũ vẫn hiển thị bình thường, vì nó không chứa cú pháp LaTeX.
- Unicode không có đủ chữ mũ/chỉ số cho mọi chữ cái (ví dụ không có chỉ số dưới cho b, c, d, q…), nên một số biểu thức sẽ lẫn chữ thường.
