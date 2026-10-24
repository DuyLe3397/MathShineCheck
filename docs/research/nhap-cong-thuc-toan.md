# Nghiên cứu: nhập và hiển thị công thức toán kiểu "Casio" trong MathShine Check

> Ngày nghiên cứu: 2026-10-23. Phạm vi: Nhận xét theo ảnh, Nhận xét chung, Ghi chú ảnh, thảo luận, Mô tả bài tập, Thông báo của giáo viên và Email thông báo.
> Bối cảnh: [ADR 0005](../adr/0005-ban-phim-toan-chen-ky-tu-unicode-thay-vi-latex.md) đã chọn Bàn phím toán chèn ký tự Unicode. Bản thử `src/app/shared/components/math-keyboard.prototype.html` bị đánh giá là xấu và thiếu (không có phân số thật, tích phân có cận, hệ phương trình, vectơ có mũi tên). Tài liệu này trả lời câu hỏi: **có cách nào bấm công thức và thấy nó hiện đúng như máy Casio (phân số xếp chồng, căn trùm lên biểu thức, số mũ nâng lên) không?**
>
> Quy ước: số liệu đo trực tiếp ghi "(đo)". Cách đo: tải tarball npm vào thư mục tạm bằng `npm pack`, đo kích thước tệp đã minify, nén `gzip -9` và `brotli`. Không cài gói nào vào repo. Ý nào chưa kiểm chứng được bằng nguồn gốc thì ghi **chưa xác minh**.

---

## 1. Tóm tắt và khuyến nghị

**Trả lời ngắn: có, làm được.** Hiển thị tự nhiên kiểu Casio (Natural Display: phân số xếp chồng, ô trống để điền, con trỏ đi vào tử/mẫu/cận) chỉ đạt được bằng một **trình soạn công thức trực quan (WYSIWYG)**. Trong các thư viện mã nguồn mở còn được bảo trì, **MathLive** là lựa chọn gần Casio nhất. Phần hiển thị công thức đã lưu thì dùng **KaTeX** vì nhẹ hơn nhiều.

**Khuyến nghị (phương án "Lai: chữ + công thức chèn"):**

1. Ô nhập vẫn là `<textarea>`/`<input>` như hiện nay, để học sinh gõ tiếng Việt bằng bàn phím của điện thoại (Telex/VNI) mà không bị cản.
2. Nút **"Chèn công thức"** (thay cho Bàn phím toán Unicode) mở một bảng trượt từ đáy màn hình. Trong bảng có một `<math-field>` của MathLive với **bàn phím ảo tự thiết kế theo Toán 10–12** (phân số, căn, mũ, chỉ số, vectơ, tích phân có cận, giới hạn, hệ, tổ hợp/chỉnh hợp…). Bấm "Chèn" thì công thức được ghi vào chỗ con trỏ dưới dạng `\(…LaTeX…\)`.
3. Firestore **vẫn lưu một chuỗi** (không đổi mô hình dữ liệu). Khi hiển thị, chuỗi được tách thành đoạn chữ và đoạn công thức. Đoạn công thức được KaTeX vẽ qua một directive. Nội dung cũ không có `\(` nên hiện y như bây giờ.
4. MathLive (~227 KB gzip, đo) chỉ tải **khi người dùng mở bảng nhập công thức**. KaTeX (~76 KB gzip, đo) chỉ tải **khi nội dung có công thức**. Trang không có công thức thì không tốn thêm gì.
5. Ở Email thông báo, công thức được **chuyển thành dạng một dòng dễ đọc** (ví dụ `(x+1)/(2x−3)`, `√(x²+1)`, `vt AB`) và kèm câu "Mở trên MathShine để xem công thức". Gmail không hiển thị SVG hay ảnh base64, còn hỗ trợ MathML trong email thì chưa xác minh được (mục 4.6).
6. Hướng này **thay thế ADR 0005**, nên cần ADR mới và cập nhật thuật ngữ trong CONTEXT.md.

## 2. Bảng so sánh

| Giải pháp | Hiển thị tự nhiên kiểu Casio | Nhập trên điện thoại | Dung lượng bundle (đo, gzip) | Email | Công sức tích hợp | Giấy phép | Mức bảo trì |
|---|---|---|---|---|---|---|---|
| **A. Unicode (hiện tại, ADR 0005)** | Không. Mọi thứ nằm trên một dòng | Tốt, chèn ký tự vào ô thường | 0 | Tốt nhất (chữ thường) | Đã có bản thử | — | — |
| **B. MathLive cho cả ô (toàn bộ ô là `math-field`)** | **Có**, khi soạn và khi xem | Kém với văn bản tiếng Việt: bàn phím hệ điều hành bị chặn, chế độ chữ còn lỗi (mục 4.1) | ~227 KB JS + font (tải khi dùng) | Kém: phải chuyển đổi | Cao | MIT | Rất tích cực (0.111.1, 2026-10-09) |
| **C. LaTeX `$…$` + KaTeX + bảng mẫu chèn mã** | Chỉ khi xem. Lúc soạn vẫn thấy mã LaTeX | Trung bình: người dùng nhìn thấy `\frac{}{}` | ~76 KB JS + ~3,5 KB CSS + font khi cần | Kém: hiện mã thô nếu không chuyển đổi | Thấp–trung bình | MIT | Tích cực (0.19.0, 2026-10-01) |
| **D. Lai: chữ + công thức chèn qua bảng MathLive, hiển thị bằng KaTeX (khuyến nghị)** | **Có**: soạn công thức kiểu Casio, xem cũng xếp chồng | **Tốt**: chữ gõ bằng bàn phím điện thoại, công thức bấm bằng bàn phím ảo | Xem: ~76 KB (chỉ khi có công thức). Soạn: thêm ~227 KB (chỉ khi mở bảng) | Trung bình: dạng một dòng tự sinh + link | Trung bình | MIT + MIT | Cả hai đều tích cực |
| **E. MathJax 4 thay KaTeX để hiển thị** | Khi xem: có | (cần trình soạn riêng) | ~281 KB (`tex-chtml.js`) đến ~615 KB (`tex-svg.js`) | Có thể dựng SVG phía máy chủ, nhưng Gmail không hiện SVG | Trung bình | Apache-2.0 | Tích cực (4.1.3, 2026-07-03) |
| **F. Temml (LaTeX → MathML gốc của trình duyệt)** | Khi xem: có, chất lượng tùy font toán của máy | (cần trình soạn riêng) | ~50 KB + font 9 KB tùy chọn | Như C | Thấp | MIT | Tích cực (0.14.0, 2026-10-08) |
| **G. MathQuill** | Có (WYSIWYG) | Không có bàn phím ảo theo tài liệu; phụ thuộc jQuery | chưa đo | Như C | Trung bình | MPL-2.0 | Yếu: bản phát hành cuối năm 2016 |
| **H. MathType/WIRIS cho web** | Có | Có | chưa xác minh | Có dịch vụ ảnh (chưa xác minh) | Trung bình | Thương mại, báo giá theo số người dùng | Thương mại |

Nguồn của từng ô nằm ở mục 4.

## 3. Hiện trạng trong codebase (đã đọc)

- Nội dung lưu trên Firestore là chuỗi thuần: `content: string` trong `src/app/models/index.ts`. Hiển thị bằng `{{ content }}` với `white-space: pre-wrap` (ví dụ `grading.component.ts` dòng ~207, `results.component.ts` dòng ~115/242/500, `student/discussions.component.ts` dòng ~416).
- Ô nhập: `<textarea>` ở Chấm bài, Kết quả và Thảo luận; `<input>` một dòng ở một số chỗ trong `teacher/discussions.component.ts`. `grading.component.ts` đã có sẵn đoạn chèn tại con trỏ (`selectionStart`/`setSelectionRange`, dòng ~1424–1445), nên có thể tái dùng để chèn `\(…\)`.
- Thông báo (`teacherNotifications`) lưu trường `content` dạng chuỗi (`firestore.service.ts` dòng ~845, ~1105).
- Email: `email-api/lib/build-email.js` đưa `content` vào cả bản `text` lẫn `html` (`escapeHtml` + `white-space:pre-wrap`). Vì vậy nếu không xử lý thì email sẽ hiện mã LaTeX thô.
- Mọi trang đều tải trễ qua `loadComponent` (`app.routes.ts`). Ngân sách `initial` là 1 MB (cảnh báo) / 2 MB (lỗi) (`angular.json`). Thư viện nạp bằng `import()` động sẽ nằm ở chunk riêng, không tính vào `initial`.
- Ứng dụng **không có tìm kiếm toàn văn** trên nội dung nhận xét (không tìm thấy trong code), nên lưu LaTeX không làm hỏng tính năng tìm kiếm nào.

## 4. Phân tích từng giải pháp

### 4.1 MathLive (`mathlive`, thẻ `<math-field>`)

**Phiên bản, giấy phép, bảo trì**
- npm `mathlive@0.111.1`, phát hành 2026-10-09, giấy phép MIT ([npm](https://www.npmjs.com/package/mathlive), [CHANGELOG](https://github.com/arnog/mathlive/blob/master/CHANGELOG.md)). Repo [arnog/mathlive](https://github.com/arnog/mathlive) được đẩy mã lần cuối ngày 2026-10-23, có khoảng 184 issue đang mở (GitHub API, xem ngày 2026-10-23). Nhịp phát hành 2026: 0.109.1 (04-01), 0.109.2 (04-28), 0.110.0 (06-08), 0.111.0 (09-30), 0.111.1 (10-09) ([CHANGELOG](https://github.com/arnog/mathlive/blob/master/CHANGELOG.md)).
- Vẫn đang ở bản 0.x, nên giữa các bản phụ có thể có thay đổi phá vỡ. Ví dụ ở 0.111.0: bỏ phụ thuộc `@cortex-js/compute-engine`, bỏ định dạng `math-json` của `getValue()`, và `<math-field>` đổi `role` từ `math` sang `group` ([CHANGELOG](https://github.com/arnog/mathlive/blob/master/CHANGELOG.md)). Cần **ghim phiên bản chính xác** trong `package.json`.

**Có hiển thị như Casio không?** Có. `<math-field>` là trình soạn WYSIWYG: phân số, căn, mũ, chỉ số được vẽ ngay khi gõ. Mẫu có ô trống được định nghĩa bằng placeholder: `#@` lấy vùng chọn hoặc "đối số ngầm bên trái con trỏ", `#0`/`#?` tạo ô trống, ví dụ `"\\frac{#@}{#?}"`, `"\\sqrt{#0}"` ([hướng dẫn tùy biến bàn phím ảo](https://mathlive.io/mathfield/guides/virtual-keyboard/)). Đây đúng là hành vi "gõ 2 rồi bấm phân số, 2 tự vào tử số" giống Casio. Bàn phím mặc định đã có tích phân có cận trống `\int_{#?}^{#?}` (thấy trong mã nguồn `mathlive.mjs` 0.111.1).

**Nhập trên điện thoại**
- Chính sách `mathVirtualKeyboardPolicy`: `"auto"` (mặc định) là "trên thiết bị cảm ứng, hiện bàn phím ảo khi ô được focus"; ngoài ra có `"manual"` và `"sandboxed"` ([hướng dẫn](https://mathlive.io/mathfield/guides/virtual-keyboard/); kiểu `'auto' | 'manual' | 'sandboxed'` trong `types/options.d.ts` của gói).
- Bàn phím hệ điều hành bị chặn: phần tử nhận phím bên trong là `<span contenteditable … inputmode=none>` (mã nguồn `mathlive.mjs` 0.111.1, dòng ~39222). `inputmode=none` báo cho trình duyệt không bật bàn phím ảo của hệ điều hành. Tốt cho công thức, **nhưng không gõ được tiếng Việt có dấu bằng bàn phím điện thoại trong ô này.**
- Bàn phím ảo mặc định có các bố cục numeric, symbols, alphabetic, greek; nhấn giữ để chọn biến thể; có thanh hoàn tác/làm lại/dán ([Math Virtual Keyboard](https://mathlive.io/mathfield/virtual-keyboard/)). Bố cục tự định nghĩa qua `mathVirtualKeyboard.layouts` với các hàng phím. Phím có thể là chuỗi LaTeX hoặc đối tượng `{label, latex, insert, command, class, width, shift, variants…}`. Tài liệu khuyên tối đa 10 phím mỗi hàng ([hướng dẫn](https://mathlive.io/mathfield/guides/virtual-keyboard/)).
- Một số issue di động còn mở: [#3085](https://github.com/arnog/mathlive/issues/3085) (iOS: chạm vào ô trống làm trang cuộn), [#2965](https://github.com/arnog/mathlive/issues/2965) (điện thoại: không bấm được mục menu nằm đè lên ô), [#2561](https://github.com/arnog/mathlive/issues/2561) (bàn phím tự đóng khi gõ nhanh trong container tùy biến), [#3058](https://github.com/arnog/mathlive/issues/3058) (IME composition xóa vùng chọn). Mức ảnh hưởng thực tế với học sinh dùng Android/iPhone **chưa xác minh**, cần thử trên máy thật.

**Dùng cả ô làm `math-field` cho văn bản dài tiếng Việt (giải pháp B): không nên**
- `defaultMode: 'inline-math' | 'math' | 'text'` có tồn tại (`types/options.d.ts`), nhưng còn issue mở [#3078](https://github.com/arnog/mathlive/issues/3078): khi `defaultMode` là `"text"`, phần chữ bị tuần tự hóa không có `\text{}`, nên giá trị "không dùng được bên ngoài mathfield". Thêm [#2420](https://github.com/arnog/mathlive/issues/2420) (yêu cầu tính năng tương tự, vẫn mở).
- Kết hợp với `inputmode=none` ở trên: học sinh không gõ được câu tiếng Việt bằng Telex trên điện thoại. Bàn phím ảo alphabetic của MathLive có hỗ trợ dấu tiếng Việt hay không thì **chưa xác minh** (không thấy trong tài liệu).

**Đầu ra và hiển thị tĩnh**
- `getValue(format)` hỗ trợ `'latex' | 'latex-expanded' | 'latex-unstyled' | 'latex-without-placeholders' | 'typst' | 'math-ml' | 'ascii-math' | 'plain-text' | 'spoken' …` (`types/core-types.d.ts`, `OutputFormat`).
- Hiển thị tĩnh: `<math-span>`/`<math-div>`, `renderMathInElement()`, `convertLatexToMarkup()`, `convertLatexToMathMl()`. Các hàm chuyển đổi "không cần môi trường trình duyệt, dùng được trong Node.js", có gói con `mathlive/ssr` ([Static rendering](https://mathlive.io/mathfield/guides/static/); `exports["./ssr"]` trong `package.json` của gói). Mặc định chỉ nhận dấu phân cách `\(…\)`, `\[…\]`, `$$…$$`; `$…$` phải tự bật ([Static rendering](https://mathlive.io/mathfield/guides/static/)).
- Bản 0.111.1 vá một lỗi **XSS** ở tùy chọn `\enclose` của `<math-span>`/`<math-div>` ([CHANGELOG](https://github.com/arnog/mathlive/blob/master/CHANGELOG.md)). Đây là lý do nữa để ghim và theo dõi phiên bản.
- **Phát hiện khi chạy thử (đo, Node 22, `mathlive/ssr` 0.111.1):** `convertLatexToAsciiMath('\\frac{x+1}{2x-3}')` cho `(x+1)/(2x-3)` và `cases` cho `{(x+y=3),(2x-y=0):}`, đều tốt. Nhưng `\overrightarrow{AB}` cho ASCIIMath **rỗng**, còn MathML thì thành `<mover >→</mover>` (**mất chữ AB**). Vectơ là ký hiệu rất hay gặp ở lớp 10, nên **không nên dựa vào bộ chuyển đổi của MathLive để sinh nội dung email**. Nên tự viết bộ chuyển "một dòng" nhỏ (mục 5).

**Dung lượng (đo, 0.111.1):** `mathlive.min.mjs` 843 KB thô / **227 KB gzip** / 187 KB brotli; `mathlive-ssr.min.mjs` 398 KB / 111 KB gzip; `mathlive-static.css` 3 KB gzip; thư mục `fonts/` 304 KB (20 tệp woff2, trình duyệt chỉ tải tệp nào thực sự dùng); `sounds/` 244 KB (có thể tắt bằng `MathfieldElement.soundsDirectory = null`, `types/mathfield-element.d.ts`). Ước tính "~700 KB+" trong ADR 0005 khớp với kích thước thô, còn qua mạng (gzip) khoảng 227 KB.
- **Phát hiện:** font của MathLive **trùng từng byte** với font của KaTeX 0.19.0 (cùng tên `KaTeX_*.woff2`, cùng md5, đã so 3 tệp: Main-Regular, Math-Italic, AMS-Regular). Vì vậy công thức lúc soạn (MathLive) và lúc xem (KaTeX) trông giống hệt nhau. Có thể trỏ `MathfieldElement.fontsDirectory` về cùng thư mục font để trình duyệt chỉ tải một lần.

**Bản địa hóa:** bảng chuỗi giao diện có sẵn các ngôn ngữ en, ar, de, el, es, fr, he, it, ja, ko, pl, pt, uk, zh-cn, zh-tw; **không có tiếng Việt** (mã nguồn `mathlive.mjs` 0.111.1, dòng ~1248–2283). Có thể ghi đè bằng `MathfieldElement.strings` / `MathfieldElement.locale` (`types/mathfield-element.d.ts`). Nhãn phím trong bố cục tự định nghĩa thì do mình tự đặt.

**Trợ năng:** có xuất lời đọc (`spoken`, `spoken-ssml`) và nhãn ARIA ([README](https://github.com/arnog/mathlive)).

**Tích hợp Angular 18:** `<math-field>` là custom element, nên component cần `schemas: [CUSTOM_ELEMENTS_SCHEMA]` ([Angular API](https://angular.dev/api/core/CUSTOM_ELEMENTS_SCHEMA)). Nạp bằng `await import('mathlive')` trong component bảng nhập để thành chunk tải trễ. Đọc giá trị qua sự kiện `(input)` rồi `el.getValue('latex-expanded')`. Chưa xác minh `latex-expanded` có thay các macro riêng của MathLive (`\differentialD`, …) thành `\mathrm{d}` hay không, cần thử. Mã nguồn có định nghĩa `differentialD: "\\mathrm{d}"`.

### 4.2 LaTeX trong chuỗi + KaTeX (giải pháp C, và là phần hiển thị của D)

- `katex@0.19.0`, phát hành 2026-10-01, MIT ([npm](https://www.npmjs.com/package/katex), [releases](https://github.com/KaTeX/KaTeX/releases)). Bản 0.19.0 có thay đổi phá vỡ ở chế độ `strict` (cảnh báo `symbolNotInFont`) ([releases](https://github.com/KaTeX/KaTeX/releases)).
- **Dung lượng (đo):** `katex.min.js` 273 KB thô / **76 KB gzip** / 63 KB brotli; `katex.min.css` 25 KB / 3,5 KB gzip; `contrib/auto-render.min.js` 1,6 KB gzip; 20 tệp font woff2 tổng 296 KB, nhưng trình duyệt chỉ tải font nào được dùng. Con số "~300 KB" trong ADR 0005 là kích thước thô.
- **Dấu phân cách:** auto-render mặc định **không** bật `$…$`, chỉ có `$$…$$`, `\(…\)`, `\[…\]` và một số môi trường. Nếu thêm `$` thì phải đặt sau `$$`. Trang tài liệu không mô tả cách thoát ký tự `$` ([auto-render](https://katex.org/docs/autorender)). Đây là lý do khuyến nghị lưu bằng `\(…\)` (mục 6).
- **Tùy chọn an toàn:** `trust` mặc định `false` (chặn `\includegraphics`, `\href`…). `maxExpand` mặc định 1000. `maxSize` mặc định `Infinity`, nên đặt giới hạn. `throwOnError` mặc định `true` ([options](https://katex.org/docs/options)).
- **Đầu ra:** `output` là `html` | `mathml` | `htmlAndMathml` (mặc định, có MathML ẩn cho trình đọc màn hình) ([options](https://katex.org/docs/options)).
- **Phát hiện quan trọng cho Angular (đo + mã nguồn):** HTML của KaTeX dùng thuộc tính `style` nội tuyến, dùng `<svg>` cho căn và mũi tên co giãn (`\sqrt`, `\overrightarrow`), và có `<math>`. Bộ lọc `[innerHTML]` của Angular 18.2 **không cho phép thuộc tính `style`**, và bỏ SVG một cách có chủ đích ("This currently consciously doesn't support SVG") ([html_sanitizer.ts, nhánh 18.2.x](https://github.com/angular/angular/blob/18.2.x/packages/core/src/sanitization/html_sanitizer.ts)). Vì vậy **không được** gắn kết quả KaTeX bằng `[innerHTML]`. Thay vào đó, viết directive gọi `katex.render(latex, element, {trust:false, throwOnError:false, maxSize:…})` trực tiếp lên phần tử. KaTeX tự dựng DOM và tự thoát chữ.
- **Tương thích LaTeX do MathLive sinh ra (đo):** KaTeX 0.19.0 vẽ được hết các mẫu Toán 10–12 đã thử: `\frac`, `\sqrt[3]{}`, `\int_{0}^{1}…\,\mathrm{d}x`, `\lim_{x\to0}`, `cases`, `aligned` trong `\left\lbrace…\right.`, hệ hoặc `\left[\begin{array}{l}…\end{array}\right.`, `\overrightarrow{AB}`, `\vec{u}`, `\widehat{ABC}`, `\overline{abc}`, `\binom`, `\mathrm{C}_n^k`, `bmatrix`, `\mathbb{R}`, `30^{\circ}`, `\degree`, `\parallel`, `\perp`, `\triangle`, `\angle`. KaTeX **báo lỗi** với các lệnh riêng của MathLive: `\differentialD`, `\exponentialE`, `\imaginaryI`, `\placeholder{}`. Cách xử lý: khai báo `macros` cho KaTeX (`\differentialD → \mathrm{d}` …) và không cho lưu khi còn ô trống (`getValue('latex-without-placeholders')` hoặc kiểm tra trước khi chèn).
- **Chữ tiếng Việt trong `\text{}`** vẽ được (đo: không lỗi, font hệ thống thay thế), nhưng ở chế độ `strict: 'warn'` KaTeX in cảnh báo `unicodeTextInMathMode` nếu chữ có dấu nằm ngoài `\text{}`. Với mô hình lai thì chữ tiếng Việt chủ yếu nằm ngoài công thức nên ít gặp.
- **Nhập khi chỉ có KaTeX:** người dùng phải gõ hoặc chèn mẫu `\frac{}{}` và nhìn thấy mã. Lúc soạn **không** giống Casio, chỉ lúc xem mới đẹp. Với học sinh lớp 10 trên điện thoại thì đây là điểm yếu lớn, nên C chỉ hợp làm phương án dự phòng hoặc lối tắt cho giáo viên trên máy tính.

### 4.3 MathJax 4

- `mathjax@4.1.3` (2026-07-03), Apache-2.0 ([npm](https://www.npmjs.com/package/mathjax), [releases](https://github.com/mathjax/MathJax/releases)). Bản 4.0 thêm ngắt dòng cho cả công thức nội dòng lẫn công thức riêng dòng, hỗ trợ thêm font, bật Expression Explorer (trợ năng) mặc định, và là bản nâng cấp có thể phá vỡ ([What's new in 4.0](https://docs.mathjax.org/en/latest/upgrading/whats-new-4.0.html)).
- **Dung lượng (đo, 4.1.3):** `tex-chtml.js` 997 KB / **281 KB gzip**; `tex-svg.js` 1,85 MB / **615 KB gzip**; `tex-svg-nofont.js` 255 KB gzip. Bộ nào cũng nặng gấp 3–8 lần KaTeX.
- Tốc độ so với KaTeX: không tìm được benchmark chính thức của cả hai phía, nên **chưa xác minh**.
- Ưu điểm thật sự: dựng được SVG trong Node (dùng cho email dạng ảnh, mục 4.6) và ngắt dòng công thức dài trên màn hình hẹp. Với nhận xét ngắn của MathShine, KaTeX là đủ.

### 4.4 MathML Core gốc của trình duyệt (và Temml)

- Chrome 109 hỗ trợ MathML Core, "được vẽ tương thích CSS với OpenType MATH" ([Chrome 109 beta](https://developer.chrome.com/blog/chrome-109-beta)). MDN xếp MathML vào Baseline "Widely available", có trên mọi trình duyệt từ tháng 1/2023 ([MDN MathML](https://developer.mozilla.org/en-US/docs/Web/MathML)). Theo caniuse: Chrome 109+, Edge 109+, Firefox, Safari 10+, Safari iOS 5+, Chrome Android, Samsung Internet 21+, tổng ~96% người dùng ([caniuse](https://caniuse.com/mathml)).
- Như vậy **có thể hiển thị không cần thư viện vẽ**, nhưng vẫn cần một bộ chuyển LaTeX → MathML. **Temml** làm đúng việc này: `temml@0.14.0` (2026-10-08), MIT, "TeX-to-MathML", chạy được trên trình duyệt và Node, không có phụ thuộc ([temml.org](https://temml.org/), [npm](https://www.npmjs.com/package/temml)). Dung lượng (đo): `temml.min.js` 168 KB / **50 KB gzip**, font `Temml.woff2` 9 KB. KaTeX cũng xuất được MathML với `output:'mathml'` ([options](https://katex.org/docs/options)).
- Chất lượng hiển thị phụ thuộc font toán có trên máy. Trên Android/iOS thật thì phân số, căn, mũi tên vectơ trông ra sao **chưa xác minh**. Temml có tệp CSS chọn font (Latin Modern, Asana, STIX Two, Libertinus, Noto Sans; `dist/` của gói). Đây là phương án nhẹ hơn KaTeX khoảng 26 KB gzip, đổi lại rủi ro không đồng nhất giữa các máy. Mặt khác, giao diện lúc soạn (MathLive, font KaTeX) sẽ khác lúc xem.

### 4.5 Trình soạn khác

- **MathQuill:** giấy phép MPL-2.0. Phát hành GitHub cuối cùng là `v0.10.1` (2016-03-22), bản npm cuối `0.10.1-a` (2016-06-13). Repo được đẩy mã lần cuối 2025-06-02 (GitHub API). README viết "MathQuill is resuming active development" ([repo](https://github.com/mathquill/mathquill)). Thư viện phụ thuộc jQuery 1.5.2+ ([Getting Started](http://docs.mathquill.com/en/latest/Getting_Started/)). Không có bàn phím ảo trong tài liệu. **Không phù hợp:** bảo trì yếu, phải tự làm bàn phím ảo, kéo thêm jQuery.
- **MathType/WIRIS cho web:** trang giá trả về 403 khi kiểm tra. Theo kết quả tìm kiếm trỏ tới [wiris.com/pricing](https://www.wiris.com/pricing), gói "MathType for HTML Editors" là **báo giá theo số người dùng**, có dùng thử 30 ngày (chưa xác minh trực tiếp). **Không phù hợp** với dự án nhỏ, miễn phí cho học sinh: tốn chi phí định kỳ, phụ thuộc dịch vụ ngoài.
- **Desmos:** là API máy tính đồ thị. Desmos có bản fork MathQuill riêng ([desmosinc/mathquill](https://github.com/desmosinc/mathquill)). Điều khoản API **chưa xác minh**. Không phải trình soạn cho nhận xét, nên loại.
- **`@cortex-js/compute-engine`** (0.161.0, MIT, [npm](https://www.npmjs.com/package/@cortex-js/compute-engine)): dùng để tính toán/giải biểu thức, không cần cho nhập liệu. Từ 0.111.0 MathLive đã bỏ phụ thuộc này ([CHANGELOG](https://github.com/arnog/mathlive/blob/master/CHANGELOG.md)).

### 4.6 Email thông báo, Thông báo, Firestore

- **Firestore:** cả C và D đều lưu chuỗi, không đổi schema. Chuỗi chứa `\(\frac{1}{2}\)` dài hơn chữ thường, nhưng nhận xét thì ngắn.
- **Email, các hướng đã xét:**
  - *SVG nhúng/đính kèm:* Gmail webmail **không** hiển thị (`html-svg`: Gmail desktop webmail 2020-02 "n"; `image-svg`: Gmail 2020-02 và 2023-01 "n") ([caniemail html-svg](https://github.com/hteumeuleu/caniemail/blob/main/_features/html-svg.md), [caniemail image-svg](https://github.com/hteumeuleu/caniemail/blob/main/_features/image-svg.md)).
  - *Ảnh base64 (data URI):* Gmail "n" (2020-02, 2024-05) ([caniemail image-base64](https://github.com/hteumeuleu/caniemail/blob/main/_features/image-base64.md)).
  - *Ảnh PNG có URL:* Gmail "y" ([caniemail image-png](https://github.com/hteumeuleu/caniemail/blob/main/_features/image-png.md)). Muốn làm vậy thì phải dựng PNG phía máy chủ (MathJax/Node → SVG → PNG) rồi lưu lên Storage. Cách này nặng và tốn công cho một email thông báo. Khả năng chạy được trong hàm Vercel hiện tại **chưa xác minh**.
  - *MathML trong email:* caniemail không có mục MathML (đã kiểm tra danh sách `_features`). Mức hỗ trợ của Gmail/Outlook **chưa xác minh**.
  - **Đề xuất:** email dùng **dạng một dòng tự sinh** + nút "Mở trên MathShine" sẵn có. Không dùng bộ chuyển ASCIIMath của MathLive cho vectơ (mất chữ, xem 4.1).
- **Thông báo trong ứng dụng (chuông của giáo viên):** hiển thị `content` bằng cùng directive KaTeX, hoặc dạng một dòng nếu ô xem trước bị cắt ngắn.

## 5. Phương án đề xuất cho MathShine (D: chữ + công thức chèn)

**Dữ liệu lưu**
```
Đạo hàm sai ở bước 2: \(f'(x)=\frac{2x+1}{(x^2+x)^2}\) phải có dấu trừ. Xem lại \(\overrightarrow{AB}\cdot\overrightarrow{AC}\).
```
Chữ ngoài `\(…\)` là văn bản thường, giữ nguyên `white-space: pre-wrap`.

**Các bước triển khai (ước lượng, chưa xác minh bằng spike)**
1. **ADR mới thay ADR 0005** + cập nhật CONTEXT.md: thay "Bàn phím toán / Mẫu ký hiệu / Chế độ mũ – chỉ số" bằng thuật ngữ mới (ví dụ "Công thức", "Ô công thức").
2. **Spike 1–2 ngày trên máy thật** (Android Chrome + iPhone Safari): một trang thử với `<math-field>` + bố cục bàn phím Toán 10–12 + KaTeX hiển thị. Kiểm tra các issue #3085/#2561, độ lớn phím, chiều cao bàn phím so với màn hình, đường dẫn font.
3. **`MathTextComponent`** (hiển thị): tách chuỗi theo `\(`…`\)`. Đoạn chữ hiện bằng nội suy Angular; đoạn công thức dùng directive gọi `katex.render` (không dùng `[innerHTML]`, xem 4.2). Chỉ `import('katex')` khi có ít nhất một công thức. Khai báo `macros` cho `\differentialD` v.v. Đặt `maxSize`, `maxExpand`, `trust:false`, `throwOnError:false`. Thay `{{ content }}` ở khoảng 6 chỗ: grading, results, 2 trang discussions, chú thích ảnh, mô tả bài tập.
4. **`FormulaSheetComponent`** (nhập): bảng trượt đáy (điện thoại) hoặc popover (máy tính), `import('mathlive')` khi mở. Bố cục phím tự định nghĩa, nhãn tiếng Việt, tắt âm thanh, `fontsDirectory` trùng font KaTeX. Nút "Chèn" ghi `\(${latex}\)` vào vị trí con trỏ (tái dùng logic chèn ở `grading.component.ts`). **Sửa công thức đã chèn:** ở vùng xem trước dưới ô nhập, chạm vào công thức sẽ mở lại bảng với LaTeX đó và thay đúng đoạn.
5. **Xem trước dưới ô nhập:** vì `<textarea>`/`<input>` không vẽ được công thức, hiện một dòng "Xem trước" dùng `MathTextComponent` khi nội dung có `\(`. Ô thảo luận một dòng (`<input>`) cũng dùng cách này.
6. **Email (`email-api/lib/build-email.js`):** thêm hàm `linearizeMath(content)` chuyển `\frac{a}{b}` → `(a)/(b)`, `\sqrt{x}` → `√(x)`, `^{…}`/`_{…}` → ký tự mũ/chỉ số Unicode hoặc `^(…)`, `\overrightarrow{AB}` → `vt AB`, `\int_a^b` → `∫[a→b]`, `cases` → `{ … ; … }`; lệnh không biết thì giữ nguyên mã. Có thể tái dùng bảng ký tự mũ/chỉ số và mẫu "vt AB" từ bản thử Unicode. Viết test `node --test` giống thư mục `email-api/test`.
7. **Kiểm thử:** unit test cho bộ tách `\(…\)` (cặp lẻ, `\(` không đóng, nội dung cũ có `$`), cho `linearizeMath`, và cho danh sách mẫu Toán 10–12 vẽ được bằng KaTeX.

**Tác động bundle:** trang không có công thức không đổi. Trang có công thức tải thêm ~76 KB gzip JS + ~3,5 KB CSS + vài font woff2 (5–28 KB mỗi tệp). Mở bảng nhập tải thêm ~227 KB gzip (một lần, sau đó được cache). Ngân sách `initial` không bị ảnh hưởng vì đều nạp bằng `import()` động.

## 6. Chuyển đổi dữ liệu cũ và ký tự `$`

- Nội dung cũ (chữ thường + ký tự Unicode √ π ≤ x² uₙ "vt AB") **không chứa `\(`**, nên bộ tách coi toàn bộ là chữ và hiện y như hiện nay. Không cần migration.
- **Vì sao chọn `\(…\)` thay vì `$…$`:** người dùng không bao giờ phải gõ tay dấu phân cách, vì nút "Chèn" tự thêm. Như vậy:
  - không phải xử lý `$` trong chữ thường (ví dụ "giá 5$", "$100"),
  - không cần cơ chế thoát `\$` (tài liệu auto-render của KaTeX cũng không mô tả cách thoát `$`, [auto-render](https://katex.org/docs/autorender)),
  - và cả KaTeX lẫn MathLive đều nhận `\(…\)` làm dấu phân cách nội dòng mặc định ([auto-render](https://katex.org/docs/autorender), [MathLive static](https://mathlive.io/mathfield/guides/static/)).
- Bộ tách nên tự viết (vài chục dòng), **không** dùng `auto-render`, để: bỏ qua `\(` không có `\)` (coi là chữ), không quét toàn DOM, và giữ nội suy Angular cho phần chữ.
- Bàn phím Unicode cũ có thể giữ lại một thời gian như "ký hiệu nhanh" hoặc bỏ hẳn: xem quyết định mở số 4.

## 7. Những quyết định còn mở cho người dùng

1. **Chọn mô hình:** D (lai, khuyến nghị) hay B (toàn bộ ô là `math-field`, đẹp nhất khi soạn nhưng chặn gõ tiếng Việt trên điện thoại)? Hay chỉ C (rẻ nhưng người dùng phải nhìn mã LaTeX)?
2. **Bộ vẽ khi xem:** KaTeX (đồng nhất với MathLive vì chung font, ~76 KB) hay Temml/MathML gốc (~50 KB, phụ thuộc font của máy, chưa thử trên điện thoại thật)?
3. **Email thông báo:** chấp nhận dạng một dòng tự sinh + link (khuyến nghị), hay đầu tư dựng ảnh PNG phía máy chủ để email hiện công thức xếp chồng?
4. **Số phận Bàn phím toán Unicode (ADR 0005):** bỏ hẳn, hay giữ hàng "ký hiệu nhanh" (≤ ≥ ∈ ℝ π °) trong ô chữ cho ký hiệu đơn lẻ không cần mở bảng công thức?
5. **Phạm vi trường áp dụng và bộ phím:** áp dụng cho cả 5 loại ô hay chỉ Nhận xét theo ảnh/Nhận xét chung trước? Danh sách phím Toán 10–12 cần có (ví dụ: tổ hợp `C_n^k`, chỉnh hợp `A_n^k`, `\widehat{ABC}`, hệ "và" `{` / hệ "hoặc" `[`, ma trận có cần không)?

## 8. Nguồn

**Gói npm và kho mã**
- MathLive: https://www.npmjs.com/package/mathlive · https://github.com/arnog/mathlive · https://github.com/arnog/mathlive/blob/master/CHANGELOG.md
- MathLive docs: https://mathlive.io/mathfield/virtual-keyboard/ · https://mathlive.io/mathfield/guides/virtual-keyboard/ · https://mathlive.io/mathfield/guides/static/
- MathLive issues: [#3078](https://github.com/arnog/mathlive/issues/3078) · [#2420](https://github.com/arnog/mathlive/issues/2420) · [#3085](https://github.com/arnog/mathlive/issues/3085) · [#2965](https://github.com/arnog/mathlive/issues/2965) · [#2561](https://github.com/arnog/mathlive/issues/2561) · [#3058](https://github.com/arnog/mathlive/issues/3058)
- KaTeX: https://www.npmjs.com/package/katex · https://github.com/KaTeX/KaTeX/releases · https://katex.org/docs/autorender · https://katex.org/docs/options
- MathJax: https://www.npmjs.com/package/mathjax · https://github.com/mathjax/MathJax/releases · https://docs.mathjax.org/en/latest/upgrading/whats-new-4.0.html
- Temml: https://temml.org/ · https://www.npmjs.com/package/temml
- MathQuill: https://github.com/mathquill/mathquill · http://docs.mathquill.com/en/latest/Getting_Started/ · https://github.com/desmosinc/mathquill
- Compute Engine: https://www.npmjs.com/package/@cortex-js/compute-engine
- WIRIS: https://www.wiris.com/pricing (trang trả về 403, thông tin giá chưa xác minh trực tiếp)

**Trình duyệt và email**
- MathML: https://developer.mozilla.org/en-US/docs/Web/MathML · https://caniuse.com/mathml · https://developer.chrome.com/blog/chrome-109-beta
- caniemail: https://github.com/hteumeuleu/caniemail/blob/main/_features/html-svg.md · https://github.com/hteumeuleu/caniemail/blob/main/_features/image-svg.md · https://github.com/hteumeuleu/caniemail/blob/main/_features/image-base64.md · https://github.com/hteumeuleu/caniemail/blob/main/_features/image-png.md

**Angular**
- https://angular.dev/api/core/CUSTOM_ELEMENTS_SCHEMA
- https://github.com/angular/angular/blob/18.2.x/packages/core/src/sanitization/html_sanitizer.ts

**Đo đạc cục bộ (2026-10-23):** `npm pack mathlive@0.111.1 katex@0.19.0 temml@0.14.0 mathjax@4.1.3` vào thư mục tạm ngoài repo. Đo kích thước bằng `stat`, `gzip -9`, `brotli`. Chạy thử `mathlive/ssr` (`convertLatexToAsciiMath`, `convertLatexToMathMl`, `convertLatexToMarkup`) và `katex.renderToString` trên Node 22. So md5 font của hai gói.
