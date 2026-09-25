---
name: gen-srs
description: Tổng hợp BRD và nhiều tài liệu HDSD chức năng thành tài liệu đặc tả yêu cầu phần mềm (SRS, .docx) đúng cấu trúc/định dạng một file template SRS chuẩn, có ảnh chụp màn hình thật. Dùng khi người dùng yêu cầu soạn/sinh SRS cho một phân hệ gồm nhiều chức năng.
---

# Sinh tài liệu đặc tả yêu cầu phần mềm (SRS) từ BRD + HDSD + template .docx

Đúc kết từ quá trình tạo `SRS-Phan-He-Dai-Ly.docx` (Phân hệ Ngân hàng Đại lý), tổng hợp từ 1 tài liệu BRD (xem skill `gen-brd`), 6 tài liệu HDSD chức năng (xem skill `gen-hdsd`) và 1 file template SRS chuẩn.

## 1. Role

Bạn là **Business Analyst** biên soạn Tài liệu đặc tả yêu cầu phần mềm (SRS) cho hệ thống nghiệp vụ ngân hàng (RLOS v3), tổng hợp lại từ các tài liệu đã có (BRD, HDSD) và mã nguồn thực tế khi cần đối chiếu — không tự suy diễn nghiệp vụ, không bịa trường/nút/quy tắc không có nguồn.

## 2. Mục tiêu

Sinh 1 file `SRS-<Tên phân hệ>.docx` **giữ đúng cấu trúc và định dạng** của file template SRS chuẩn (`template/Tai-Lieu_SRS_v1.0.docx`), nội dung Phần 2 (mô tả chức năng chi tiết) được dựng lại chính xác theo các tài liệu HDSD/BRD đã có — có ảnh chụp màn hình thật, không suy đoán trường dữ liệu/business rule không có căn cứ.

## 3. Input

- File template bắt buộc dùng làm chuẩn format: `template/Tai-Lieu_SRS_v1.0.docx` — đây thường là 1 SRS **đã hoàn thiện thật** của 1 phân hệ khác (không phải file rỗng có placeholder), dùng để đọc style/cấu trúc, không copy nội dung nghiệp vụ của phân hệ đó.
- 1 (hoặc nhiều phiên bản) tài liệu BRD của phân hệ đang làm — nếu có nhiều phiên bản (vd bản đầy đủ nội bộ v1.0 và bản đã lược cho khách hàng v1.1), **phải hỏi người dùng phiên bản nào là chuẩn nội dung** trước khi bắt đầu, không tự chọn.
- Toàn bộ tài liệu HDSD của từng chức năng thuộc phạm vi phân hệ (mỗi HDSD thường nằm ở thư mục module riêng, tên file khác nhau tùy người viết).
- Mã nguồn FE/BE khi cần đối chiếu chức năng đã thay đổi sau khi HDSD được viết (xem Mục 8).

## 4. Quy tắc bắt buộc — hỏi lại trước khi suy đoán

Không tự quyết các điểm sau, phải dùng câu hỏi trắc nghiệm hỏi lại người dùng ngay khi phát hiện, **trước khi dựng nội dung**:

- **Phạm vi output**: 1 file SRS gộp toàn phân hệ (nhiều nhóm chức năng trong 1 Phần 2), hay nhiều file SRS riêng theo từng chức năng?
- **Nguồn chuẩn khi có nhiều phiên bản BRD khác nhau về phạm vi** (ví dụ bản đầy đủ vs bản đã lược cho khách hàng).
- **Nhóm chức năng có trong BRD nhưng không có HDSD/ảnh màn hình đi kèm**: bỏ qua hoàn toàn, hay vẫn đưa vào Phần 2 ở dạng mô tả từ BRD kèm ghi chú rõ "chưa có ảnh, sẽ bổ sung sau"?
- **File SRS cũ đã tồn tại sẵn** (nếu có): dùng làm nội dung nền để tái cấu trúc theo template mới, hay bỏ qua và viết lại hoàn toàn từ BRD + HDSD?
- **Mâu thuẫn dữ liệu giữa BRD và HDSD** (ví dụ BRD mô tả quy trình Maker-Checker nhưng HDSD ghi rõ "không áp dụng phê duyệt", hoặc ngược lại): đây là dấu hiệu HDSD được viết trước khi 1 nghiệp vụ được code bổ sung/sửa lại — phải hỏi người dùng cách xử lý (theo HDSD, theo BRD, hay đọc lại mã nguồn thực tế để xác nhận, xem Mục 8), **không tự chọn 1 bên**.
- **Thông tin hành chính trang bìa** (Hợp đồng số, Gói thầu, Người tạo/Người phê duyệt cụ thể): không tự bịa số hợp đồng hay tên người — để `[CẦN BỔ SUNG]` hoặc hỏi người dùng, trừ Mã dự án/Tên dự án đã có sẵn trong BRD thì dùng luôn.

Ngoài ra:
- Không suy diễn quy tắc nghiệp vụ/trường dữ liệu không có trong BRD/HDSD — chỗ thiếu thông tin đánh dấu `[CẦN XÁC NHẬN]`.
- Nếu HDSD của 1 chức năng dùng schema cột khác với template chuẩn (vd HDSD dùng "Kiểu dữ liệu", template dùng "Loại control" + "Chỉnh sửa" + "Giá trị mặc định"), phải **map khái niệm tương đương** (Kiểu dữ liệu ≈ Loại control) chứ không đổi tên tùy tiện; cột nào HDSD không có dữ liệu tương ứng (vd "Chỉnh sửa") thì để trống/gạch ngang `—`, **không tự suy đoán Có/Không**.

## 5. Khảo sát template trước khi dựng (python-docx)

Không đoán style — đọc số liệu thật từ file mẫu bằng python-docx trước:

```python
import docx
d = docx.Document("template/Tai-Lieu_SRS_v1.0.docx")
for name in ["Normal", "Heading 1", "Heading 2", "Title", "Caption"]:
    st = d.styles[name]
    print(name, st.font.size.pt if st.font.size else None, st.font.bold, st.base_style.name)

sec = d.sections[-1]
print(sec.page_width, sec.page_height, sec.left_margin, sec.top_margin)
print(sec.header.tables[0].rows[0].cells)   # logo + tên công ty
print(sec.footer.tables[0].rows[0].cells)   # tên hệ thống + field PAGE
```

Lưu ý quan trọng phát hiện được: **Không mở file mẫu rồi xóa nội dung body để viết đè lên** như cách làm với HDSD (xem skill `gen-hdsd` mục 5) — với SRS nhiều `sectPr` (bìa khổ dọc, có thể có trang bảng khổ ngang ở giữa), việc xóa các đoạn ngắt-section giữa file làm ĐỨT liên kết `headerReference`/`footerReference` của section cuối cùng (section cuối có thể đang ở chế độ *linked to previous*, xóa section trước là mất luôn header/footer thật). Cách an toàn: **dựng file mới bằng `docx.Document()`**, đo lại chính xác margin/kích thước trang/style từ file mẫu rồi set lại thủ công, và tự dựng header (logo + tên công ty) + footer (tên hệ thống + field `PAGE`) bằng bảng 1 dòng 2 cột ẩn viền — xem code mẫu ở Mục 6.

Trích logo ra file ảnh riêng để tái sử dụng khi dựng header/trang bìa:

```python
from docx.oxml.ns import qn
hdr = d.sections[0].header
blip = hdr._element.findall('.//' + qn('a:blip'))[0]
part = hdr.part.related_parts[blip.get(qn('r:embed'))]
open("logo.jpeg", "wb").write(part.blob)
```

## 6. Kỹ thuật dựng file (python-docx) — các điểm dễ sai

- **Font toàn tài liệu**: set trực tiếp trên style `Normal`/`Heading 1-4` (ascii/hAnsi/eastAsia đều phải set `Times New Roman` qua `w:rFonts`, không chỉ set `run.font.name` — nếu không sẽ ra Calibri ở phần chữ có dấu tiếng Việt trên một số máy).
- **Bảng bị Word tự co lại chỉ bằng nửa trang dù đã set `cell.width`**: đây là lỗi auto-fit mặc định của Word — set `cell.width` một mình KHÔNG đủ. Phải ép layout cố định:

```python
def set_table_fixed_layout(table, col_widths_cm, total_cm=17.2):  # 17.2 = A4 trừ margin trái/phải
    tblPr = table._tbl.tblPr
    tblW = OxmlElement('w:tblW'); tblW.set(qn('w:w'), str(int(total_cm*566.929))); tblW.set(qn('w:type'), 'dxa')
    tblPr.append(tblW)
    layout = OxmlElement('w:tblLayout'); layout.set(qn('w:type'), 'fixed'); tblPr.append(layout)
    # + set lại toàn bộ w:gridCol trong tblGrid và w:tcW của từng cell theo đúng col_widths_cm (đã scale cho vừa total_cm)
    table.autofit = False
```
  Áp dụng hàm này cho **mọi bảng** (bảng mô tả use case, bảng giải thích trường, bảng business rule, cả bảng trang bìa/ký duyệt) — không chỉ bảng dữ liệu, nếu không các bảng sẽ trông không đồng nhất.
- **Field tự động** (`PAGE`, `TOC`, `SEQ`) đều dựng bằng chuỗi `w:fldChar begin` → `w:instrText` → `w:fldChar separate` → (text cache để hiển thị tạm trước khi Word tính lại) → `w:fldChar end`, chèn trực tiếp vào 1 run bằng OxmlElement. Ba loại hay dùng:
  - `PAGE   \* MERGEFORMAT` — số trang ở footer.
  - `TOC \o "1-3" \h \z \u` — Mục lục theo Heading 1-3.
  - `TOC \c "Hinh" \h \z` — Danh sách hình, đi kèm mỗi caption ảnh phải là 1 field `SEQ Hinh \* ARABIC` (không phải chữ số gõ tay) thì field này mới quét ra được — xem Mục 9.
- **Sau khi sinh xong, python-docx không tính được số trang thật** (không render). Luôn để lại field, không bịa số trang tĩnh, và nói rõ với người dùng: mở file trong Word, `Ctrl+A` rồi `F9` (hoặc chuột phải từng field → Update Field) để Word tính lại Mục lục/Danh sách hình/số trang.

## 7. Quy trình thực hiện

1. Đọc kỹ file lệnh/yêu cầu của người dùng, liệt kê toàn bộ file input đã cung cấp (BRD, các HDSD, template) — tìm đúng đường dẫn thật trong repo bằng `find`/Glob, đối chiếu tên file phần "input" người dùng liệt kê với file thực tế (thường nằm rải ở nhiều thư mục theo người viết khác nhau).
2. Đọc BRD trước để nắm toàn bộ nhóm chức năng thuộc phạm vi phân hệ (thường có 1 chương "Phạm vi" hoặc "Yêu cầu chức năng chi tiết" liệt kê đủ danh sách nhóm) — đối chiếu số nhóm này với số file HDSD đang có. Nếu lệch (nhóm có trong BRD nhưng thiếu HDSD), áp dụng Mục 4.
3. Trích toàn bộ nội dung (đoạn văn + bảng) và toàn bộ ảnh của từng HDSD + BRD ra file text/ảnh riêng bằng python-docx (đi theo đúng thứ tự block trong body, xem code mẫu ở skill `gen-hdsd`), lưu ra thư mục tạm để đọc lại nhiều lần mà không phải mở lại file `.docx` (không đọc trực tiếp file `.docx` bằng tool đọc file thường — sẽ báo lỗi binary).
4. Khảo sát template theo Mục 5, xác định đúng font/size/margin/header/footer/logo thật.
5. Dựng file mới bằng `docx.Document()` (không mutate file mẫu — xem lý do ở Mục 5): viết 1 script Python duy nhất (`build_srs.py`) theo thứ tự: style → section/margin → header/footer/logo → trang bìa → trang ký duyệt → quản lý phiên bản → danh sách màn hình (để placeholder, xử lý ở Mục 9) → mục lục (field TOC) → Phần 1 (Giới thiệu, Tổng quan yêu cầu — lấy từ BRD chương Tổng quan/Quy trình nghiệp vụ) → Phần 2 (từng nhóm chức năng, xem Mục 8).
6. **Chạy script theo checkpoint từng nhóm chức năng** (`print(...); doc.save(OUT_PATH)` sau mỗi nhóm) thay vì chỉ save 1 lần ở cuối — với tài liệu lớn (vài trăm đoạn, hàng chục ảnh), debug theo checkpoint giúp xác định đúng nhóm nào gây lỗi mà không phải chạy lại từ đầu.
7. Nếu phát hiện gap khi đối chiếu HDSD với mã nguồn thực tế (chức năng đã đổi sau khi HDSD viết), xử lý theo Mục 8 trước khi viết nội dung nhóm đó.
8. Sau khi có bản đầy đủ, báo người dùng: đường dẫn file, tổng số đoạn/bảng/ảnh, danh sách mục còn `[CẦN XÁC NHẬN]`/`[CẦN BỔ SUNG]`, và nhắc bước `F9` cập nhật field.
9. **Nếu người dùng đã tự mở file trong Word và chỉnh sửa tay** (đổi header/footer, update Mục lục...) — từ thời điểm đó **không được chạy lại `build_srs.py` để ghi đè file** (sẽ mất hết chỉnh sửa tay của họ). Mọi thay đổi tiếp theo phải viết **script vá riêng** (`patch_*.py`) mở đúng file hiện tại, chỉ sửa đúng phần được yêu cầu, giữ nguyên phần còn lại, rồi save đè lên cùng file.

## 8. Khi HDSD không khớp với code thực tế (nghiệp vụ đã thay đổi sau khi viết HDSD)

Tình huống thật đã gặp: HDSD ghi "không áp dụng maker-checker", nhưng BRD/thực tế cho biết code đã bổ sung luồng duyệt sau đó. Quy trình xử lý:

1. Hỏi người dùng xác nhận đây có đúng là trường hợp "code đã cập nhật sau HDSD" không — không tự đoán bên nào đúng.
2. Nếu đúng: dùng Agent tìm trong mã nguồn (FE component/route + BE controller/service) chức năng tương ứng, đọc kỹ field/nút/điều kiện hiển thị theo role thật trong code — không suy diễn từ tên biến.
3. Nếu cần ảnh chụp thật: kiểm tra frontend/backend dev đã chạy sẵn chưa (`curl localhost:<port>`), rồi làm theo đúng skill `playwright-automation` (mở Chrome debug qua CDP, nhờ người dùng đăng nhập thủ công bằng tài khoản đúng vai trò cần xem, điều hướng, chụp bằng `page.screenshot`).
4. Nếu không dựng được môi trường/không có tài khoản test (hay gặp: hệ thống dùng Keycloak nhưng repo không có realm/user seed sẵn) — báo rõ với người dùng lý do kỹ thuật cụ thể đã kiểm tra (không phải chỉ nói "không chụp được"), hỏi họ có tài khoản/môi trường thật để cung cấp không, thay vì tự chuyển sang mô tả suông.
5. Viết nội dung mục đó theo đúng code + ảnh thật vừa chụp, và **ghi chú rõ trong Business rule** rằng nội dung này khác với HDSD nguồn vì code đã cập nhật sau, kèm ngày xác nhận với BA — để người đọc sau không hiểu nhầm là HDSD sai.
6. Nếu trong lúc đối chiếu phát hiện thêm lỗ hổng thật của hệ thống (vd trường nhập ở FE nhưng DTO backend không có chỗ lưu) — ghi nhận vào mục đó dạng `[CẦN XÁC NHẬN]`, đây là phát hiện có giá trị cho đội dev, không phải lỗi của tài liệu.

## 9. Cấu trúc Phần 2 & danh sách hình

- **Đơn vị chia nhỏ 1 "chức năng chi tiết"** trong Phần 2 = đúng theo Heading 3 (hoặc Heading 4 khi HDSD tự tách sâu hơn) đã có sẵn trong HDSD nguồn (vd "Danh sách đại lý", "Tạo mới đại lý"...) — không tự gộp/tách lại khác với cách tác giả HDSD đã chia, để mỗi mục còn truy vết ngược lại đúng 1 đoạn nguồn.
- Mỗi chức năng gồm đủ: **Bảng mô tả** (Mục đích/Tác nhân/Điều kiện khởi phát/Tiền điều kiện/Main flow/Alternative flow/Hậu điều kiện — dựng từ Mục đích/Điều kiện thực hiện/Các bước thực hiện/Kết quả/Lưu ý của HDSD) → **Màn hình** (ảnh thật, dùng `no_screen=True` kèm ghi chú nếu là tiến trình chạy ngầm không có UI) → **Giải thích các trường thông tin** (bảng, xem quy tắc map cột ở Mục 4) → **Business rule** (ưu tiên liệt kê bullet từ đúng các "Lưu ý" của HDSD; chỉ dùng bảng "Mã BR" khi nguồn đã tự đặt mã quy tắc) → **Ý kiến của khách hàng** (bảng trống để khách hàng ghi chú khi review).
- Nhóm chức năng có trong BRD nhưng chưa có HDSD/ảnh (xem Mục 4): vẫn viết đủ Bảng mô tả từ BRD, phần Màn hình để `no_screen=True` với ghi chú "chờ bổ sung ảnh chụp màn hình thực tế", phần Giải thích trường chỉ liệt kê tên trường suy ra được từ mô tả nghiệp vụ BRD (không suy đoán Loại control/Bắt buộc/Mặc định nếu BRD không nói rõ — để `[CẦN XÁC NHẬN]`).
- **Danh sách hình ở đầu tài liệu**: không gõ tay số hình + số trang. Mỗi ảnh chèn bằng caption thật kiểu Word (style `Caption`, chứa field `SEQ Hinh \* ARABIC`), sau đó ở trang "Danh sách màn hình" chèn 1 field `TOC \c "Hinh" \h \z` — khi người dùng mở Word và `F9`, danh sách hình + số trang tự sinh chính xác, đồng bộ mỗi khi thêm/bớt ảnh về sau.

## 10. Quality check trước khi báo hoàn tất

- [ ] Đã hỏi lại người dùng đủ các điểm ở Mục 4 trước khi dựng nội dung, không tự quyết thay.
- [ ] Số nhóm chức năng ở Phần 2 khớp đúng với BRD (hoặc đã có xác nhận rõ lý do bỏ bớt/giữ lại nhóm thiếu HDSD).
- [ ] Font Times New Roman, cỡ chữ đúng yêu cầu, áp dụng nhất quán cho cả bảng lẫn đoạn văn.
- [ ] Mọi bảng đã ép `fixed layout` full chiều rộng trang, không bảng nào bị co theo nội dung.
- [ ] Header/footer/logo đúng công ty/hệ thống, field `PAGE` hoạt động (không phải số tĩnh).
- [ ] Mục lục và Danh sách hình dùng field thật (`TOC`, `SEQ`), không phải liệt kê tay.
- [ ] Không có nội dung tự suy diễn — nơi thiếu căn cứ đã đánh dấu `[CẦN XÁC NHẬN]`/`[CẦN BỔ SUNG]`.
- [ ] Mọi khác biệt giữa HDSD nguồn và nội dung thực viết ra (do code cập nhật sau) đã được ghi chú rõ trong mục tương ứng.
- [ ] Nếu người dùng đã chỉnh tay file sau khi sinh: các thay đổi sau đó chỉ thực hiện qua script vá riêng trên đúng file hiện tại, không chạy lại script gốc.

## 11. Output format

Xuất file `SRS-<Tên phân hệ>.docx` (hoặc nhiều file nếu người dùng chọn phương án tách riêng ở Mục 4) vào đúng thư mục đầu ra đã thống nhất. Báo lại: tổng số đoạn/bảng/ảnh, danh sách các nhóm chức năng đã đưa vào Phần 2, danh sách mục còn `[CẦN XÁC NHẬN]`/`[CẦN BỔ SUNG]` để người dùng biết cần bổ sung gì, và nhắc bước mở Word `Ctrl+A` + `F9` để cập nhật Mục lục/Danh sách hình/số trang.
