---
name: gen-brd-summary
description: Cô đọng một BRD đầy đủ đã có sẵn (.docx) thành BRD rút gọn theo khung mục lục do người dùng chỉ định trong một file lệnh riêng, giữ nguyên định dạng Word gốc bằng cách dựng trên bản sao của chính BRD đầy đủ (có thể đổi style một số trang theo file mẫu khác nếu được yêu cầu). Dùng khi người dùng yêu cầu rút gọn/tóm tắt một BRD đã có sẵn thành phiên bản ngắn hơn.
---

# Sinh tài liệu BRD rút gọn (.docx) từ một BRD đầy đủ + file lệnh cấu trúc

Đúc kết từ quá trình tạo `BRD-Rut-Gon-Cho-Vay-Hop-Von.docx` (chức năng Cho vay hợp vốn, RLOS v3) từ `brd-cho-vay-hop-von.docx` (17 mục, xem skill `gen-brd`). Khác với sinh BRD đầy đủ từ nhiều nguồn rải rác, việc này là **cô đọng lại** một BRD đã có sẵn theo đúng khung mục lục ngắn hơn do người dùng chỉ định (thường 5 chương + phụ lục thay vì 17 mục), và **trong quá trình làm còn phải chỉnh định dạng theo 1 file mẫu khác** do người dùng trỏ tới (vd trang bìa/ký duyệt/phiên bản/header/footer giống hệt 1 file SRS đã làm trước đó) — nên kỹ năng lõi ở đây là "đọc đúng số liệu thật từ 2 nguồn `.docx` khác nhau rồi ghép lại", không phải soạn nội dung mới.

## 1. Role

Bạn là **Business Analyst** biên soạn bản BRD rút gọn từ một BRD đầy đủ đã có, đúng cấu trúc mục lục do người dùng chỉ định trong 1 file lệnh riêng — không tự quyết định cắt bớt/giữ lại mục nào ngoài phạm vi file lệnh, không diễn giải lại nội dung nghiệp vụ đã có (chỉ cô đọng câu chữ, giữ nguyên số liệu/mã BR-VR-FR).

## 2. Mục tiêu

Sinh 1 file `BRD-Rut-Gon-<Tên chức năng>.docx`, giữ **nguyên vẹn 100%** định dạng Word của chính BRD đầy đủ (font, màu Heading, bảng header navy, logo, header/footer) bằng cách dựng file mới **trên nền một bản sao của chính BRD đầy đủ** — không dựng từ file rỗng rồi set lại style thủ công (khác skill `gen-brd` mục 5.1, ở đây nguồn style/format tốt nhất chính là file đầu vào, không phải 1 file mẫu công ty riêng). Nội dung được cô đọng theo đúng khung chương/mục trong file lệnh, tái sử dụng tối đa bảng/ảnh gốc thay vì viết lại.

## 3. Input

- File lệnh cấu trúc (thường tên `<ten-chuc-nang>-command-brd-final.md`): liệt kê đúng khung mục lục đích (số chương, tên chương, các mục con), yêu cầu định dạng viết tay (font/size, trang bìa/ký duyệt/quản lý phiên bản/danh sách màn hình có bắt buộc hay không), tên file output mong muốn. **Đọc trước tiên, dùng đúng tên chương/số thứ tự ghi trong file này — không tự đặt tên khác "cho hay hơn".**
- File BRD đầy đủ nguồn (`brd-<ten-chuc-nang>.docx`, xem skill `gen-brd`) — vừa là nguồn nội dung, vừa là nguồn định dạng (font/màu/header/footer/logo/table style) để dựng file mới trên nền nó.
- (Tuỳ chọn) 1 hoặc nhiều file HDSD chức năng liên quan (xem skill `gen-hdsd`) — nguồn ảnh chụp màn hình thật để làm phụ lục hình ảnh, nếu BRD đầy đủ không tự có ảnh UI (BRD thường chỉ có sequence diagram, không có screenshot).
- (Tuỳ chọn, chỉ xuất hiện khi người dùng yêu cầu "làm giống file X") — 1 file `.docx` khác đã hoàn thiện trước đó, dùng làm chuẩn hình thức cho 1 phần cụ thể (thường là header/footer/trang bìa/trang ký duyệt/trang quản lý phiên bản). Đây là tình huống thực tế đã gặp: BRD đầy đủ có style navy/Table Grid nhất quán riêng, nhưng người dùng muốn phần đầu tài liệu (front-matter) đổi sang đúng style của 1 SRS khác cùng công ty đã làm (xem skill `gen-srs`) — phải đọc file đó bằng đúng kỹ thuật ở Mục 5, không suy từ trí nhớ hay suy diễn "chắc giống nhau".

## 4. Quy tắc bắt buộc — hỏi lại trước khi suy đoán

Dùng câu hỏi trắc nghiệm (không quá 2-3 câu, để người dùng chọn nhanh) ngay khi phát hiện, **trước khi dựng nội dung**:

- **Định dạng output**: `.docx` giữ nguyên style BRD gốc, hay `.md` thuần văn bản? (mặc định nên đề xuất `.docx` nếu BRD gốc đã có logo/header/footer chuẩn công ty, vì đó là lý do chính khiến việc dựng trên nền file gốc có giá trị).
- **Mức độ rút gọn khi file lệnh không mô tả đủ chi tiết mọi mục**: giữ đủ khung chương đã liệt kê nhưng cô đọng câu chữ trong từng mục, hay còn được cắt bỏ hẳn một số phụ lục/chương con nữa? Nếu người dùng có sẵn 1 file lệnh cấu trúc rõ ràng (khung mục lục đầy đủ số chương/tên mục), **ưu tiên bám sát đúng file lệnh đó làm chuẩn duy nhất**, không tự đề xuất phương án khác song song — tình huống thực tế: hỏi 2 lựa chọn rút gọn (giữ đủ 17 mục cô đọng / cắt bớt phụ lục) nhưng người dùng chọn "Khác: theo đúng file lệnh" vì file lệnh đã có sẵn khung 5 chương rồi, không cần hỏi lại phương án rút gọn nữa một khi đã có file lệnh.
- **Khi người dùng nói "làm giống file X"** cho 1 phần cụ thể (header/footer/trang bìa...): xác nhận đúng phạm vi (chỉ những phần được nêu tên, hay toàn bộ định dạng tài liệu?) trước khi động vào Heading style dùng chung cho cả tài liệu — đổi màu Heading 1/2/3 toàn cục sẽ lan sang mọi chương khác đã được duyệt trước đó, thường **không** phải điều người dùng muốn khi họ chỉ nêu tên 2-3 trang cụ thể.

## 5. Khảo sát 2 nguồn `.docx` trước khi dựng (python-docx + đọc XML thô)

Không đoán số liệu — luôn đọc thật, cho **cả BRD đầy đủ lẫn file mẫu tham chiếu (nếu có)**:

```python
import docx, zipfile

d = docx.Document("brd-day-du.docx")
for name in ["Normal", "Heading 1", "Heading 2", "Heading 3", "Title"]:
    st = d.styles[name]
    print(name, st.font.size, st.font.bold, st.font.color.rgb if st.font.color and st.font.color.type else None)

# bảng nào có header navy, bảng nào (mô tả FR) không tô màu — quyết định bảng nào tái dùng nguyên trạng
for i, t in enumerate(d.tables):
    shd = t.rows[0].cells[0]._tc.xml
    print(i, len(t.rows), "x", len(t.columns), "shaded" if "w:shd" in shd else "plain")

# header/footer thật (logo, bố cục, có viền hay không, field PAGE viết kiểu nào)
z = zipfile.ZipFile("brd-day-du.docx")
print(z.read("word/header1.xml").decode())
print(z.read("word/footer1.xml").decode())
```

Nếu người dùng trỏ tới 1 file mẫu khác cho front-matter (Mục 3), lặp lại đúng thao tác trên với file đó — đặc biệt lấy **đúng byte ảnh logo** (`z.read("word/media/imageN.png")` rồi ghi ra file riêng để tái sử dụng, không xuất lại logo từ nguồn khác) và đọc chính xác cấu trúc bảng 2 cột trong header/footer (mấy cột, có viền/tô màu không, cỡ chữ, màu chữ, căn trái/phải).

Nếu cần phụ lục ảnh chụp màn hình thật và nguồn là 1 file HDSD riêng: xác định đúng thứ tự ảnh gắn với đúng caption bằng cách khớp **thứ tự embed trong `document.xml`** với `document.xml.rels`, không dựa vào tên file ảnh (`imageN.png` không đảm bảo đúng thứ tự xuất hiện trong tài liệu):

```python
import re
rels = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', z.read("word/_rels/document.xml.rels").decode()))
embeds = re.findall(r'r:embed="(rId\d+)"', z.read("word/document.xml").decode())
ordered_images = [rels[e] for e in embeds]   # đúng thứ tự "Hình 1, Hình 2, ..." xuất hiện trong file
```

## 6. Kỹ thuật dựng file (python-docx) — các điểm mấu chốt

### 6.1. Dựng trên bản sao của chính BRD đầy đủ, không phải file rỗng

```python
import shutil, docx
shutil.copy(SRC_FULL, OUT_PATH)
doc = docx.Document(OUT_PATH)          # kế thừa nguyên style/theme/header/footer/logo
body = doc.element.body
sectPr = body.find(qn('w:sectPr'))
for child in list(body):
    if child is not sectPr:            # XOÁ nội dung, GIỮ LẠI sectPr
        body.remove(child)
```

Giữ `sectPr` lại (không xoá rồi thêm lại ở cuối) vì `CT_Body` khai báo `p`/`tbl` là `ZeroOrMore(..., successors=("w:sectPr",))` — nghĩa là mọi `doc.add_paragraph()`/`doc.add_table()` gọi sau đó **tự động chèn đúng trước `sectPr`**, không cần tự quản lý vị trí. Nếu lỡ xoá luôn `sectPr`, `doc.add_table()` sẽ lỗi `IndexError` ngay vì `document.sections` rỗng (nó cần đọc `sectPr` để tính `_block_width`).

### 6.2. Tái sử dụng bảng gốc bằng `deepcopy` thay vì gõ lại

Đây là kỹ thuật quan trọng nhất để vừa nhanh vừa **không bao giờ sai định dạng** (bảng tra cứu header navy giữ đúng màu, bảng mô tả FR giữ đúng "không tô màu" theo brief công ty — xem skill `gen-brd` mục 5.6) — vì copy nguyên XML gốc, không dựng lại từ đầu:

```python
def copy_table(doc, src_table):
    new_tbl = copy.deepcopy(src_table._tbl)
    sectPr = doc.element.body.find(qn('w:sectPr'))
    sectPr.addprevious(new_tbl) if sectPr is not None else doc.element.body.append(new_tbl)
    doc.add_paragraph()   # bảng liền sectPr/bảng khác không hợp lệ, luôn chèn 1 đoạn trống theo sau
```

Dò đúng `src.tables[i]` cần dùng bằng cách in `len(t.rows)`, `len(t.columns)` và vài ô đầu của từng bảng nguồn (Mục 5) rồi map bằng tay 1 lần vào 1 danh sách hằng số ở đầu script — không đoán chỉ số theo trí nhớ giữa các lần sửa.

### 6.3. Bảng "Bước thực hiện" đặt trước mỗi sequence diagram — tái dùng đúng bảng gốc

BRD đầy đủ soạn theo skill `gen-brd` đã có sẵn đúng 1 bảng `Bước | Hệ thống | Người thực hiện` (hoặc tên cột theo actor thật) ngay trước mỗi ảnh sequence diagram. Khi rút gọn, **đừng bỏ sót bảng này** dù nó không nằm trong khung mục lục tóm tắt của file lệnh — nó vẫn nên đi kèm ảnh diagram tương ứng vì người đọc cần bảng bước trước khi nhìn hình. Dùng `copy_table()` (Mục 6.2) lấy nguyên bảng đó từ BRD đầy đủ, không tự viết lại — tự viết lại dễ bỏ sót nhánh `alt`/`else` hoặc sai tên actor.

### 6.4. Phụ lục ảnh chụp màn hình thật + Danh sách hình tự động

Nếu BRD gốc không có screenshot UI thật (chỉ có sequence diagram), và người dùng có 1 file HDSD chức năng liên quan — trích ảnh thật theo đúng thứ tự ở Mục 5, dựng thành **1 phụ lục riêng** (không nhét từng ảnh rải rác vào giữa các mục FR nếu file lệnh không yêu cầu vậy), mỗi ảnh cỡ lớn (~12cm) kèm **caption thật** (không gõ tay số "Hình N" — dùng field `SEQ` để Word tự đánh số, nối tiếp đúng số các sequence diagram đã chèn trước đó trong tài liệu):

```python
def add_figure_caption(doc, description, counter=[0]):
    counter[0] += 1
    p = doc.add_paragraph(style="Caption")   # style "Caption" có sẵn trong mọi file Word chuẩn
    r1 = p.add_run("Hình ")
    r2 = p.add_run(); _append_seq_field(r2, "SEQ Hinh \\* ARABIC", str(counter[0]))
    p.add_run(f" – {description}")
```

Trang "Danh sách màn hình" ở đầu tài liệu **không gõ tay** — chèn field `TOC \c "Hinh" \h \z` (Danh sách hình), Word sẽ tự quét mọi caption style `Caption` chứa field `SEQ Hinh` và liệt kê kèm số trang khi người dùng mở file, `Ctrl+A` rồi `F9`. Đây là đúng kỹ thuật đã dùng trong skill `gen-srs` mục 9 — nếu tài liệu SRS liên quan đã áp dụng cách này, BRD rút gọn nên nhất quán theo, không tự bịa cách đánh số khác (gõ tay "Hình 1, Hình 2..." rồi liệt kê thủ công trong 1 bảng — cách này từng bị người dùng yêu cầu sửa lại đúng thành kỹ thuật field tự động).

### 6.5. Mục lục & số trang tự động

Giống skill `gen-brd` mục 5.5 — `TOC \o "1-3" \h \z \u` cho mục lục, `PAGE \* MERGEFORMAT` cho số trang footer, dựng bằng chuỗi `w:fldChar begin → w:instrText → w:fldChar separate → text cache → w:fldChar end`. Luôn để lại dòng nhắc người dùng `Ctrl+A` + `F9` trong chính đoạn chứa field (không chỉ nói miệng ở cuối hội thoại) vì python-docx/LibreOffice không tính lại được số trang thật.

### 6.6. Đổi header/footer/trang bìa/ký duyệt/quản lý phiên bản theo 1 file mẫu KHÁC — chỉ đúng phạm vi được yêu cầu

Tình huống thực tế: BRD rút gọn dựng trên nền BRD đầy đủ (Table Grid, header navy có viền) nhưng người dùng muốn 3 trang đầu + header/footer đổi sang đúng style của 1 SRS khác (bảng 2 cột không viền, logo khác, màu chữ khác). Xử lý:

- **Dựng lại đúng header/footer bằng API `section.header`/`section.footer`**, không sửa tay XML gốc còn sót từ file BRD đầy đủ đã copy sang — xoá sạch nội dung cũ trước:

```python
header = doc.sections[0].header; header.is_linked_to_previous = False
for el in list(header._element): header._element.remove(el)
hp = header.add_paragraph(); hp.style = doc.styles["Header"]
ht = header.add_table(rows=1, cols=2, width=Cm(17.2))
ht.style = doc.styles["Normal Table"]     # KHÔNG dùng "Table Grid" — mẫu SRS này không viền
```

- **Các trang trang bìa/ký duyệt/quản lý phiên bản dùng đúng bố cục bảng của file mẫu** (thường style `Normal Table`, không viền/không tô màu — khác hẳn các bảng nội dung navy còn lại của tài liệu) — đọc đúng số hàng/cột/nhãn từ file mẫu (Mục 5), không tự sáng tác thêm/bớt vai trò ký duyệt nếu file mẫu chỉ có 2 vai trò (Người tạo/Người phê duyệt).
- **Không đổi màu `Heading 1/2/3` dùng chung toàn tài liệu** chỉ vì file mẫu tham chiếu dùng tông màu khác — giữ nguyên style Heading đã thiết lập từ BRD đầy đủ (đã được duyệt cho toàn bộ Chương I-V), chỉ những trang được nêu tên rõ mới đổi bố cục/bảng.

### 6.7. Bug "Normal Table" tự co theo nội dung dù đã set `cell.width`

Khác bug ở skill `gen-brd` mục 5.2 (dxa/EMU gán nhầm), đây là bug khác: style `Normal Table` (dùng cho các trang front-matter ở Mục 6.6) mặc định **autofit theo nội dung**, set `cell.width = Cm(x)` một mình bị bỏ qua hoàn toàn — dòng chữ dài (vd 20 dấu gạch dưới để ký tên) bị bẻ làm 2 dòng dù cột đã "set" đủ rộng. Bắt buộc ép `tblLayout=fixed` + set cả 3 nơi (`tblW`, mọi `gridCol`, mọi `tcW`) giống hệt kỹ thuật ở skill `gen-brd` mục 5.3, áp dụng cho **mọi** bảng kiểu `Normal Table` mới dựng (bảng ký duyệt, bảng thông tin dự án, bảng lịch sử phiên bản) — bảng nào chỉ set `cell.width` mà không ép `tblLayout` coi như chưa set gì.

## 7. Quy trình thực hiện

1. Đọc kỹ file lệnh cấu trúc (Mục 3) — lập đúng khung chương/mục đích, không tự thêm/bớt.
2. Trích toàn bộ đoạn văn + bảng của BRD đầy đủ ra 1 file text (kèm số thứ tự bảng `src.tables[i]`) để đọc lại nhiều lần mà không phải mở lại `.docx` — không đọc trực tiếp file `.docx` bằng tool đọc file thường (báo lỗi binary).
3. Khảo sát định dạng thật theo Mục 5 (font/màu/bảng nào tô màu-không tô màu/header-footer/logo) — và khảo sát luôn file mẫu tham chiếu khác nếu người dùng đã trỏ tới (Mục 3).
4. Nếu còn mơ hồ về phạm vi/định dạng output, hỏi lại theo Mục 4 trước khi viết dòng code đầu tiên.
5. Nếu cần phụ lục ảnh chụp màn hình thật, xác định đúng nguồn HDSD + đúng thứ tự ảnh theo Mục 5.
6. Viết 1 script Python duy nhất (`build_<ten>.py`) theo đúng thứ tự: copy nền (Mục 6.1) → header/footer (Mục 6.6 nếu có yêu cầu riêng, hoặc giữ nguyên nếu không) → trang bìa/ký duyệt/quản lý phiên bản → danh sách màn hình (field Mục 6.4) → mục lục (field Mục 6.5) → từng chương theo đúng khung file lệnh, cô đọng câu chữ nhưng tái dùng bảng gốc (Mục 6.2, 6.3) bất cứ khi nào bảng đó đã có sẵn đúng nội dung → phụ lục ảnh (nếu có) → phụ lục còn lại theo file lệnh.
7. Chạy theo checkpoint từng chương (`print(...); doc.save(OUT_PATH)` sau mỗi chương) để việc debug không phải chạy lại từ đầu khi tài liệu dài.
8. QA bằng render (Mục 8) — bắt buộc.
9. Khi người dùng phản hồi yêu cầu chỉnh sửa cụ thể (đổi cách làm 1 phần, ví dụ đổi bảng thumbnail sang phụ lục ảnh thật, hoặc đổi style 1 vài trang theo file khác) — xử lý theo Mục 9, **không** hỏi lại từ đầu toàn bộ Mục 4 mỗi lần, chỉ áp dụng đúng thay đổi được yêu cầu rồi build lại và QA lại đúng phần đó.
10. Báo lại theo Mục 11.

## 8. QA bằng render (môi trường không có Word/poppler)

Máy chạy tác vụ này thường là Windows không cài Word và không có `poppler-utils` (nên `pdftoppm`/tool đọc PDF theo trang mặc định không dùng được) — nhưng có sẵn LibreOffice (`C:\Program Files\LibreOffice\program\soffice.exe`) và cài được `pymupdf` (`import fitz`) bằng `pip`. Quy trình đã dùng thực tế và chạy ổn định:

```bash
"/c/Program Files/LibreOffice/program/soffice.exe" --headless --convert-to pdf "OUT.docx" --outdir .
```

```python
import fitz  # pymupdf
d = fitz.open("OUT.pdf")
for i in range(d.page_count):
    d.load_page(i).get_pixmap(matrix=fitz.Matrix(1.3, 1.3)).save(f"preview/page{i+1:02d}.png")
```

Sau đó dùng tool đọc ảnh (Read) xem lần lượt các trang **quan trọng nhất** trước (trang bìa, trang có bảng mới sửa, trang cuối mỗi bảng dài, trang chứa ảnh mới chèn) thay vì xem hết toàn bộ số trang nếu tài liệu dài — nhưng vẫn phải xem đủ mọi loại trang đã thay đổi trong lượt sửa đó, không suy luận "chắc giống trang trước nên chắc đúng". Sau mỗi lần chỉnh sửa (đổi màu, đổi độ rộng cột...), **luôn xoá PDF/preview cũ rồi export lại** trước khi xem — dễ nhầm đang xem bản render cũ nếu quên xoá.

## 9. Xử lý yêu cầu chỉnh sửa lặp lại

Tài liệu dạng này thường được người dùng review nhiều vòng, mỗi vòng yêu cầu 1 thay đổi cụ thể (vd: "làm phụ lục ảnh giống SRS", "thêm bảng bước trước sequence diagram", "làm header/footer/3 trang đầu giống file X"). Với mỗi vòng:

- Sửa trực tiếp trong **cùng 1 script build gốc** (không tạo script vá riêng) miễn là người dùng **chưa tự mở file `.docx` output để chỉnh tay** — script build gốc còn là nguồn sự thật duy nhất, chạy lại toàn bộ để đảm bảo nhất quán giữa các phần.
- Nếu người dùng báo đã tự sửa tay trong Word (ví dụ: "tôi đã sửa lại cho phù hợp") — **dừng chạy lại script build gốc từ thời điểm đó**, vì sẽ ghi đè mất phần họ vừa sửa tay. Yêu cầu tiếp theo phải xử lý bằng script vá riêng mở đúng file hiện tại trên đĩa, chỉ sửa đúng phần được yêu cầu (giống nguyên tắc ở skill `gen-srs` mục 7.9).
- Khi yêu cầu là "làm giống file X", luôn quay lại Mục 5 đọc đúng số liệu thật của file X trước khi sửa code — không suy từ lần đọc trước nếu X là 1 file khác chưa từng đọc trong phiên làm việc này.

## 10. Quality check trước khi báo hoàn tất

- [ ] Khung chương/mục khớp đúng 100% với file lệnh cấu trúc (Mục 3) — không thiếu, không thừa mục nào ngoài phạm vi.
- [ ] Toàn bộ bảng có thể tái dùng từ BRD đầy đủ đã được `copy_table` nguyên trạng, không có bảng nào gõ tay lại sai lệch nội dung/định dạng so với gốc (đặc biệt: bảng mô tả FR vẫn không tô màu, bảng tra cứu khác vẫn tô navy).
- [ ] Mỗi sequence diagram có đúng 1 bảng "Bước thực hiện" ngay trước ảnh, lấy nguyên từ BRD đầy đủ.
- [ ] Nếu có phụ lục ảnh chụp màn hình: đúng thứ tự ảnh theo tài liệu nguồn (đã đối chiếu embed order, không đoán theo tên file), caption dùng field `SEQ`, có field `TOC \c "Hinh"` ở trang danh sách màn hình.
- [ ] Mục lục dùng field `TOC`, số trang footer dùng field `PAGE` — không có số/nội dung gõ tay tĩnh ở 2 chỗ này.
- [ ] Nếu có yêu cầu style theo file mẫu khác: đúng phạm vi đã nêu (không lan sang Heading dùng chung), số liệu font/màu/logo đã đọc thật từ file mẫu đó, không suy đoán.
- [ ] Mọi bảng `Normal Table` mới dựng (ký duyệt, quản lý phiên bản...) đã ép `tblLayout=fixed`, không hàng nào bị vỡ dòng do auto-fit.
- [ ] Đã QA bằng render PDF thật (Mục 8), không chỉ tin python-docx mở lại không lỗi.
- [ ] Nếu người dùng đã tự sửa tay file sau lần sinh trước — xác nhận lần sửa này chỉ dùng script vá riêng, không ghi đè từ script gốc.

## 11. Output format

Xuất file `BRD-Rut-Gon-<Tên chức năng>.docx` vào đúng thư mục đã thống nhất (thường cùng thư mục `brd/` với BRD đầy đủ). Báo lại: những phần đã tái sử dụng nguyên trạng từ BRD đầy đủ (số bảng, số ảnh), những phần đã đổi style theo file mẫu khác (nếu có, nêu rõ file mẫu đã dùng), và nhắc bước mở Word `Ctrl+A` + `F9` để cập nhật Mục lục/Danh sách hình/số trang.
