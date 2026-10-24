# 0006: Công thức kiểu Casio: soạn bằng MathLive, hiển thị bằng KaTeX

Thay [ADR 0005](0005-ban-phim-toan-chen-ky-tu-unicode-thay-vi-latex.md). Nghiên cứu nền: [docs/research/nhap-cong-thuc-toan.md](../research/nhap-cong-thuc-toan.md).

## Context

Bàn phím toán chỉ chèn ký tự Unicode (ADR 0005). Trên bản thử, người dùng thấy cách này xấu và thiếu: phân số, căn của cả biểu thức, tích phân có cận, hệ/tuyển và vectơ có mũi tên đều chỉ viết được trên một dòng. Họ muốn bấm công thức và thấy nó hiện như máy Casio (natural display). Hiện ô nhập vẫn phải là chữ thường, vì học sinh gõ tiếng Việt bằng bàn phím điện thoại. Nội dung vẫn đi vào Thông báo và Email thông báo.

Các phương án đã cân nhắc (chi tiết trong bản nghiên cứu):

- Cả ô là `<math-field>`. Bị loại vì ô này chặn bàn phím hệ điều hành (`inputmode=none`), nên không gõ được tiếng Việt có dấu.
- Gõ thẳng mã LaTeX rồi chỉ dựng hình khi xem. Bị loại vì học sinh phải nhìn `\frac{}{}`.
- MathJax. Bị loại vì quá nặng (281–615 KB gzip).
- MathQuill và WIRIS. Bị loại vì một bên không còn được bảo trì, một bên tốn phí.

## Decision

Chọn mô hình lai:

- Ô nhập vẫn là `<textarea>`/`<input>`, chữ gõ bằng bàn phím của máy.
- Nút *f*(*x*) cạnh ô nhập mở thẳng **Bảng soạn công thức**: một `<math-field>` của MathLive với bàn phím ảo thiết kế cho Toán 10–12. Mọi ký hiệu và công thức đều đi qua bảng này, từ ≤ ∈ ℝ đến phân số, tích phân có cận, hệ/tuyển, vectơ. Bấm "Chèn" thì công thức được ghi vào chỗ con trỏ dưới dạng `\(…LaTeX…\)`. Con trỏ đang nằm trong một công thức thì nút *f*(*x*) mở công thức đó để sửa.
- Bản thử Bàn phím toán chèn ký tự Unicode (ADR 0005) đã bị bỏ. Lý do: hai lối nhập song song làm giao diện rối, mà Unicode vẫn xấu với phần lớn công thức.
- Dùng dấu phân cách `\(…\)`, không dùng `$…$`, để không đụng ký tự `$` trong chữ thường.
- Firestore vẫn lưu một chuỗi. Khi hiển thị, chuỗi được tách thành đoạn chữ và đoạn công thức. Đoạn công thức được KaTeX vẽ qua một directive gọi `katex.render` (`trust: false`, có `maxSize`), không đi qua `[innerHTML]`.
- Công thức luôn hiển thị cỡ lớn như Casio (`\displaystyle`): phân số và cận không bị thu nhỏ trong dòng chữ. Công thức rộng hơn khung thì thu nhỏ cả công thức cho vừa, không cuộn ngang.
- KaTeX và MathLive dùng chung bộ font KaTeX. Cả hai đều chỉ tải khi cần: KaTeX khi nội dung có công thức, MathLive khi mở Bảng soạn công thức.
- Những gì người dùng định dạng trong Bảng soạn công thức được lưu bằng LaTeX chuẩn mà KaTeX hiểu, để hiển thị lại đúng như lúc soạn:
  - In đậm: `\mathbf{…}` hoặc `\bm{…}`.
  - Gạch chân: `\underline{…}`.
  - Chữ cái thường (tab abc, chữ đứng): `\mathrm{…}`.
  - Hệ: `cases`. "Hoặc": `\left[\begin{gathered}…\end{gathered}\right.`.
  - Xuống dòng trong một Công thức: `\begin{array}{l} … \\ … \end{array}` (canh trái). Email hiện mỗi dòng một hàng.
  - Enter hoặc phím ↵ trên bàn phím toán cắt dòng tại con trỏ, như trong trình soạn văn bản: phần sau con trỏ chuyển xuống dòng mới. Con trỏ ở trong phân số, căn hay mũ thì cắt ngay sau cả khối đó, không cắt đôi.
  - Xoá lùi (Backspace máy tính và phím ⌫ ảo) ở đầu một dòng thì nối dòng đó lên cuối dòng trên. Dòng trống thì mất hẳn, còn một dòng thì bỏ khung nhiều dòng. Trong hệ cũng nối hai phương trình như vậy. Cách làm: chặn lệnh `deleteBackward` ở `executeCommand` của đối tượng nội bộ MathLive, vì cả hai phím đều đi qua đó.
  - Dấu cách trên bàn phím máy chèn khoảng trắng (`mathModeSpace = '\;'`). Mặc định MathLive bỏ qua dấu cách trong công thức.
- Khi hiển thị, công thức nhiều dòng (`array {l}`) và hệ (`cases`) được đổi sang `aligned` (canh trái; hệ thêm `\left\{ … \right.`). Lý do: KaTeX đặt các dòng của `array` / `cases` cách đều một khoảng cố định, không tính chiều cao từng dòng, nên dòng có phân số đè lên dòng sau. `aligned` và `gathered` có đo chiều cao. Dữ liệu lưu vẫn là `array` / `cases`, chỉ đổi lúc vẽ (`spaceRows` trong `katex.ts`).
- Khi hiển thị, KaTeX dùng macro `\frac → \dfrac`, nên phân số luôn lớn kể cả trong khung nhiều dòng và trong hệ, những nơi `\displaystyle` bên ngoài không có tác dụng.
- Công thức dài tự xuống dòng tại các điểm ngắt của KaTeX (sau = + − ÷…). Chỉ khối không ngắt được (phân số, hệ…) mà rộng hơn khung mới bị thu nhỏ.
- Ô thảo luận chuyển từ `<input>` một dòng sang ô nhiều dòng tự giãn như ô bình luận. Phím Enter là xuống dòng, gửi bằng nút Gửi.
- Ở mọi ô (ô chữ và Bảng soạn công thức, cả trên điện thoại lẫn máy tính), Enter chỉ xuống dòng. Chỉ nút Gửi mới gửi, và chỉ nút Chèn hoặc Lưu mới đưa công thức vào ô chữ. Các ô chữ đặt `enterkeyhint="enter"` để bàn phím điện thoại hiện phím ↵, không hiện "Gửi"/"Đi".
- Email thông báo chuyển công thức thành dạng một dòng dễ đọc (`(x+1)/(2x−3)`, `√(x²+1)`, `vt AB`) kèm link mở đúng chỗ trên MathShine.
- Khi một ô chữ có nút *f*(*x*) nhận con trỏ (bấm/chạm vào ô, hoặc đóng Bảng soạn), trang nhảy ngay để khối [Xem trước + ô chữ] nằm giữa phần màn hình còn nhìn thấy (`center-field.ts`). Khối cao hơn phần nhìn thấy thì ô chữ sát đáy, để luôn thấy chỗ đang gõ. Không tự cuộn khi Xem trước cao lên lúc đang gõ.
  - Trên điện thoại, bàn phím che nửa dưới nhưng trang không co lại (Chrome Android từ bản 108, Safari iPhone). Vì vậy "giữa" tính theo `visualViewport`, và canh lại khi `visualViewport` ngừng đổi cỡ (bàn phím bật lên xong) trong khoảng 1 giây.
  - Nếu đang nhấn chuột/ngón tay thì đợi nhả tay mới cuộn. Ô chữ nhận con trỏ ngay lúc nhấn xuống; cuộn lúc đó thì chữ trượt dưới chuột và nhả ra sẽ bôi đen nhầm.
- Dán lời giải viết sẵn có công thức LaTeX (`$…$`, `$$…$$`, `\[…\]`, ví dụ chép từ công cụ AI hoặc file LaTeX) vào ô chữ có nút *f*(*x*): ngay lúc dán, các công thức được đổi sang dạng lưu `\(…\)` (`paste-math.ts`, gắn ở `formula-button.component`).
  - Chỉ đổi lúc dán, không cho phần hiển thị hiểu `$…$`. Nếu hiểu `$…$` lúc hiển thị thì nội dung cũ có hai dấu $ (tiền, ký hiệu) có thể bị hiện sai, và dữ liệu sẽ có hai dạng.
  - Phân biệt `$` của công thức với `$` của tiền theo quy tắc Pandoc: ngay sau `$` mở và ngay trước `$` đóng không phải khoảng trắng; ngay sau `$` đóng không phải chữ số; `$…$` không vắt qua dòng; `\$` là ký tự $. "giá $5 và $10" vẫn là chữ.
  - Đoạn nào KaTeX không vẽ được thì giữ nguyên là chữ, để bình luận đã gửi không hiện chữ đỏ.
  - Dán làm hai bước hoàn tác: dán đúng chữ gốc, sau đó đổi sang công thức. Ctrl+Z lần đầu trở về đúng chữ vừa dán (còn `$…$`).
  - Phải đổi xuống dòng `\r\n` của clipboard trên Windows thành `\n` trước khi so khớp, vì ô chữ tự đổi như vậy.
- Bàn phím toán: các phím điều khiển nằm cố định, cùng một chỗ ở cả 5 tab để học sinh bấm theo thói quen. ⌫ ở ô cuối hàng 1, ↵ ngay dưới nó ở ô cuối hàng 2, ← → ở hai ô cuối hàng 4. Vì vậy hàng 1, 2 và 4 của mọi tab đủ đúng 10 ô, có test kiểm tra.
- Hai nút to cạnh nút Chèn là ↶ Hoàn tác và ↷ Làm lại (Ctrl+Z, Ctrl+Y trên máy tính cũng vậy). Hai nút nhỏ cùng chức năng trên thanh tab của MathLive bị ẩn. Lịch sử do Bảng soạn tự giữ, không dùng lịch sử của MathLive: MathLive ghi xuống dòng / nối dòng thành nhiều bước nhỏ, hoàn tác sẽ lộ dấu đánh dấu ¶ ở giữa chừng rồi kẹt lại. Mỗi lần nội dung đổi được lưu thành một bước, xuống dòng / nối dòng chỉ là một bước. Lệnh chèn gọi từ code không phát sự kiện `input`, nên chỗ nào chèn bằng code (Hệ n, Hoặc n, B, U) phải tự lưu bước.
- Ghim chính xác phiên bản `mathlive` vì thư viện vẫn ở bản 0.x.

## Consequences

- Hiển thị công thức xếp chồng như sách giáo khoa/Casio, cả lúc soạn và lúc xem.
- Không phải chuyển dữ liệu: nội dung cũ không chứa `\(` nên hiện như trước.
- Trong ô nhập, công thức vẫn là mã `\(…\)`. Cần phần xem trước ngay trên ô nhập, rộng đúng bằng ô nhập (không tính nút *f*(*x*), đính kèm, Gửi bên cạnh; `formula-preview.component` tự đo và canh theo ô nhập), có viền xanh để dễ nhận ra. Bấm vào công thức trong phần xem trước để sửa lại.
- Trong phần Xem trước, mỗi công thức có một ô nền trắng bấm được, cao và rộng theo đúng công thức (đệm 3px trên dưới, 5px hai bên). Công thức vẫn chảy tiếp sau chữ như một phần của câu. Công thức dài phải xuống dòng thì mỗi đoạn trên mỗi dòng có ô nền riêng, cao theo đoạn đó, không dồn cả công thức xuống dòng mới.
  - Không dùng nền của chính thẻ công thức: thẻ đó nằm trong dòng chữ (inline), nên nền chỉ cao bằng dòng chữ, và phân số, hệ, tích phân tràn ra ngoài.
  - Nếu đổi thẻ thành `inline-block` thì nền phủ kín, nhưng cả công thức sẽ thành một khối liền, không chảy tiếp sau chữ được.
  - Vì vậy `math-text.component` tự vẽ ô nền theo từng dòng, ôm các khối `.katex-base` của KaTeX (KaTeX chỉ ngắt dòng giữa các khối này), và vẽ lại khi khung đổi cỡ hoặc font tải xong.
  - Chỉ phần Xem trước có ô nền. Công thức trong bình luận, thảo luận đã gửi vẫn hiện liền với chữ, không viền.
- KaTeX không hiểu một số lệnh riêng của MathLive. Cần khai báo `macros` tương ứng và không cho chèn khi công thức còn ô trống.
- Email không hiện được công thức xếp chồng (Gmail không hiện SVG hay ảnh base64).
- Ô soạn chỉ được cuộn ở vùng nội dung bên trong MathLive (`::part(content)`, cả ngang lẫn dọc), không được cuộn ở thẻ `<math-field>` bên ngoài. MathLive tính vị trí chữ được bấm theo độ cuộn của chính vùng nội dung. Nếu cuộn ở ô ngoài, lúc ô đã cuộn thì con trỏ bị đặt lệch tới hàng trăm px (đã đo trên bản thử). Kiểu thanh cuộn của vùng này phải chèn vào shadow DOM.
- Không tự cuộn ô soạn ngay sau khi người dùng bấm hoặc chạm để đặt con trỏ. Chỉ tự cuộn theo con trỏ khi đang gõ hoặc di chuyển bằng phím, và chỉ khi con trỏ đã ra ngoài khung. Nếu không, chữ vừa bấm sẽ trượt khỏi chỗ ngón tay.
- Mặc định MathLive hiểu cử chỉ vuốt trong ô soạn là bôi đen, và tự cắt rồi tự cuộn phần nội dung bị khuất. Vì vậy trên màn hình cảm ứng, MathShine tự xử lý ba cử chỉ:
  - Chạm nhẹ: đặt con trỏ.
  - Vuốt: cuộn ngang/dọc ô soạn.
  - Chạm giữ khoảng 0,5 giây rồi kéo: dịch con trỏ từng chữ (kéo ngang) hoặc từng dòng (kéo dọc), giống giữ phím cách trên bàn phím điện thoại. Cách này bù cho việc mỗi chữ chỉ rộng khoảng 12–15px, nhỏ hơn đầu ngón tay.

  Vùng nội dung phải đặt `touch-action: none`. Nếu để trình duyệt tự cuộn, nó sẽ huỷ ngang (`pointercancel`) các cử chỉ trên. Với chuột, kéo vẫn là bôi đen.
- Ô soạn phải có `user-select: text`. `styles.scss` đặt `user-select: none` cho mọi phần tử, và MathLive thấy giá trị này thì bỏ qua mọi thao tác bấm hay chạm: không đặt con trỏ, không bôi đen. Lỗi này từng lọt lên trang thật vì bản thử không có dòng CSS đó. `formula-tap.spec.ts` có test kiểm tra riêng điểm này.
- Chạm hoặc bấm vào chỗ không có chữ (bên phải một dòng ngắn, lề trái, giữa hai dòng), trên cả cảm ứng lẫn chuột: MathShine tự đặt con trỏ vào dòng gần nhất. Chạm bên phải thì về cuối dòng, bên trái thì về đầu dòng. Lý do: với công thức nhiều dòng hoặc hệ, MathLive chỉ đặt con trỏ trước hoặc sau cả khối. Khi gom dòng, bỏ qua các ký tự cao trùm nhiều dòng (ngoặc `{` của hệ, ∫, ∑). Chạm trúng chữ thì giữ nguyên kết quả của MathLive.
- Hiệu năng khi gõ nhanh. Đo trên bản thử, giả lập điện thoại có CPU chậm 4 lần, chạm phím ảo liên tục:
  - Hệ 6 dòng: trung vị từ 232ms xuống ~150ms, bằng MathLive nguyên bản. Công thức ngắn: 112ms xuống 88ms.
  - Để đạt mức này, bản chính thức phải giữ ba điều:
    1. Không làm gì nặng sau từng phím. Việc kiểm tra nút Chèn, dòng gợi ý và cỡ chữ ô soạn chỉ chạy khi ngừng gõ ~0,15 giây. Bấm Chèn thì luôn kiểm tra lại ngay.
    2. Gỡ khối nút bàn phím/menu (`.ML__toggles`) khỏi shadow DOM. Nếu còn, sau mỗi lần vẽ MathLive đọc `offsetHeight` để căn khối này, ép tính lại bố cục ngay.
    3. Gộp `scrollIntoView()` nội bộ của MathLive (vẽ lại + đo + cuộn, bị gọi 2 lần mỗi phím) thành tối đa một lần mỗi khung hình, và đặt `onScrollIntoView` rỗng để bỏ phần cuộn cả trang.
  - Phần còn lại là việc MathLive vẽ lại toàn bộ công thức mỗi phím: công thức càng dài càng chậm, không giảm thêm được nếu không sửa MathLive.
  - Mục 3 dùng thuộc tính nội bộ `_mathfield`, nên phải ghim chính xác phiên bản MathLive và kiểm tra lại khi nâng cấp.
- MathLive còn vài lỗi mở trên di động. Phải thử trên Android và iPhone thật trước khi triển khai.

## Triển khai (2026-10-24)

- Mã dùng chung nằm ở `src/app/shared/math/`:
  - `math-text.ts`: tách chữ/công thức, chuyển LaTeX thành một dòng.
  - `math-text.component.ts`: hiển thị công thức bằng KaTeX, tải động.
  - `formula-editor.component.ts` và `formula-editor.service.ts`: Bảng soạn công thức, tải MathLive động.
  - `formula-button.component.ts` (nút *f*(*x*)), `formula-preview.component.ts` (Xem trước), `math-plain.pipe.ts` (chữ một dòng).
  - `formula-keyboard.ts` (các tab phím), `formula-lines.ts` (xuống dòng/xoá dòng).
  - `math.scss`: CSS chung.
- Ghim `mathlive@0.111.1` và `katex@0.19.0`. `katex.min.css` nằm trong `styles` của `angular.json`; MathLive dùng chung font đó (`--ML__static-fonts`).
- Email thông báo: `email-api/lib/math-text.js` là bản sao `latexToLine`/`toPlainText`, sửa bên này thì sửa cả bên kia.
- Bản thử (prototype) nằm ở `src/app/shared/components/math-formula.prototype.html` (kèm `.katex.css`) và `math-keyboard.prototype.html`, không được build vào ứng dụng.
