---
name: gen-brd
description: Tổng hợp yêu cầu nghiệp vụ từ nhiều nguồn rải rác (kế hoạch thiết kế, mẫu biểu giấy gốc, PRD/ADR, HDSD/testcase, package SQL) thành tài liệu BRD (.docx) đúng template Word chuẩn công ty, có sequence diagram As-Is/To-Be. Dùng khi người dùng yêu cầu soạn/sinh BRD đầy đủ cho một chức năng mới.
---

# Sinh tài liệu BRD (.docx) từ nhiều nguồn rải rác, đúng template công ty

Đúc kết từ quá trình tạo `brd-cho-vay-hop-von.docx` (chức năng Cho vay hợp vốn, RLOS v3). Khác với HDSD (skill `gen-hdsd`, viết cho người dùng cuối), BRD viết cho Business Owner/Dev/QA, phải tổng hợp từ nhiều nguồn không đồng nhất và phải khớp chính xác một file `.docx` mẫu của công ty về font/màu/bảng/header/footer/logo.

Nếu mục tiêu là **rút gọn một BRD đầy đủ đã có sẵn** theo khung mục lục ngắn hơn (không phải soạn BRD mới từ đầu), dùng skill `gen-brd-summary` thay vì skill này.

## 1. Role

Bạn là **Senior Business Analyst** tổng hợp yêu cầu nghiệp vụ từ nhiều nguồn không đồng nhất (kế hoạch thiết kế, chứng từ giấy gốc, PRD/ADR đã chốt, hành vi thực tế của bản dựng) thành một BRD chuẩn doanh nghiệp — không suy diễn liều lĩnh, tách rõ sự kiện đã xác nhận với suy luận của BA.

## 2. Mục tiêu

Sinh một file `<ten-thu-muc>/brd/brd-<ten-chuc-nang>.docx` đúng cấu trúc nội dung của `template/PRM-BA-BRD-001.md`, đúng định dạng Word của một file mẫu công ty (`template/P2605_CEP_VAM_BRD_v1.1.docx` hoặc file mẫu được chỉ định trong yêu cầu), có sequence diagram minh hoạ quy trình As-Is/To-Be, và đã được **render kiểm tra bằng mắt** trước khi báo hoàn tất — không chỉ mở bằng python-docx rồi tin là xong.

## 3. Input

- File chỉ dẫn của tác vụ (thường tên `<ten-chuc-nang>-command-brd.md`): liệt kê toàn bộ thư mục nguồn, tên file mẫu Word, đường dẫn output, và các quy tắc định dạng viết tay (font/size, màu header bảng, ngoại lệ không tô màu, header/footer/logo, màu actor trong sequence diagram). **Đọc file này trước tiên và coi mỗi dòng là một hạng mục phải đối chiếu lại ở bước QA cuối, không chỉ đọc một lần rồi quên.**
- `template/PRM-BA-BRD-001.md` — cấu trúc nội dung bắt buộc (17 mục) + quy tắc tư duy BA (suy luận, không copy nguyên User Story). **Không lặp lại nội dung file này trong skill/script — chỉ trỏ tới và tuân theo.**
- File mẫu Word của công ty (`P2605_CEP_VAM_BRD_v1.1.docx` hoặc tương đương) — nguồn sự thật duy nhất cho **hình thức** (font/màu/logo/header/footer), không tự bịa theo cảm nhận.
- Ảnh mẫu màu actor cho sequence diagram (vd `template/template-sequence.png`).
- Toàn bộ nguồn nghiệp vụ: kế hoạch thiết kế module, bộ mẫu biểu giấy gốc (định nghĩa quy trình As-Is và đúng thuật ngữ nghiệp vụ), PRD/ADR đã chốt kiến trúc, HDSD + bộ testcase của bản dựng hiện tại (định nghĩa hành vi To-Be thật, không phải hành vi lý tưởng), package SQL nếu có (cho mục Data Mapping).

## 4. Quy tắc bắt buộc

- Đọc **hết** từng nguồn ở Mục 3, không đọc lướt/mẫu — một nguồn bị bỏ sót thường lộ ra sau này dưới dạng chi tiết bịa hoặc sai lệch trong bảng.
- Trước khi viết một con số/mã cụ thể (khoảng mã BR-01..BR-13, số lượng User Story, số dòng testcase, tên tài khoản mẫu...), **kiểm tra lại đúng trong file nguồn** (grep/đếm thật), không suy từ trí nhớ.
- Đánh dấu rõ ràng, nhất quán một ký hiệu cho mỗi loại nội dung không có trong nguồn gốc: `(Đề xuất – BA suy luận)` cho phần BA chủ động bổ sung hợp lý, `[CẦN XÁC NHẬN]` cho khoảng trống nghiệp vụ chưa rõ. Không lẫn hai loại.
- Không tự thêm quy trình/chức năng "cho giống các module khác" nếu module đang viết không có — kể cả khi file mẫu tham khảo hình thức có mô tả điều đó.

## 5. Dựng file .docx đúng format — các cạm bẫy kỹ thuật

Đây là phần khác biệt lớn nhất so với sinh tài liệu Markdown thường: BRD phải là `.docx` thật, mở trong Word không lỗi, đúng pixel-perfect theo file mẫu công ty. Dùng **python-docx**; các cạm bẫy dưới đây đã thực sự gây lỗi và tốn thời gian phát hiện lại nếu không ghi lại.

### 5.1. Lấy đúng hình thức từ file mẫu — không tự bịa

`unzip file_mau.docx -d dir` (đây là file zip) rồi đọc trực tiếp:
- `word/document.xml`: màu Heading, màu header bảng, font mặc định trong `word/styles.xml` (`docDefaults` + style `Normal`/`Heading1..3` — đọc số thật, không đoán).
- `word/header*.xml`, `word/footer*.xml`, `word/media/*`: cấu trúc header/footer (thường là 1 bảng 2 cột không viền: logo trái, tên công ty/tiêu đề phải, viền dưới màu navy; footer: tên tài liệu in nghiêng + tab + field số trang PAGE/NUMPAGES).
- **Dùng lại nguyên ảnh logo lấy từ chính file mẫu** (copy byte, không xuất lại từ file khác) — đây là letterhead thật của công ty.

### 5.2. Bug "dxa bị gán nhầm EMU" — nguyên nhân phổ biến nhất khiến bảng vỡ layout

Nếu độ rộng bảng được set bằng cách gán thẳng một số nguyên (vd lấy từ `Cm(17)`, tức 6.120.000) vào thuộc tính `w:w` của `<w:tblW w:type="dxa">` **mà không quy đổi EMU → twips (chia 635)**, Word/LibreOffice sẽ nhận một bảng rộng ~4.250 inch thay vì ~17cm thật. Dấu hiệu nhận biết: giá trị `w:w` là bội số tròn của 360.000 (= N cm tính bằng EMU) trong khi ngữ cảnh là `type="dxa"`. Bảng loại này thường có `tblLayout type="fixed"` nên Word sẽ tuân theo đúng con số sai đó — hậu quả là mọi bảng trong tài liệu tràn trang. Khi audit một `.docx` có sẵn, luôn kiểm tra: `content_width_twips = pgSz.w - pgMar.left - pgMar.right` (A4 chuẩn lề 2cm mỗi bên ≈ 9638 twips) và so với `tblW/@w:w` thật của từng bảng.

### 5.3. Công thức chia cột theo nội dung — tránh cả 2 thái cực

Chia đều cột (n cột → mỗi cột 1/n) làm cột mô tả dài bị bóp; lấy độ dài **lớn nhất** (max) trong cột để tính trọng số lại làm hỏng các bảng dạng nhãn/giá trị (2 cột: cột nhãn như "Điều kiện sau (Post-condition)" bị coi là "ngắn" trong khi cột giá trị có 1 đoạn văn rất dài áp đảo trọng số, đẩy cột nhãn xuống mức sàn tối thiểu → nhãn bị vỡ chữ từng âm tiết). Công thức đã kiểm chứng: lấy **độ dài trung bình** (không phân biệt hàng tiêu đề hay hàng dữ liệu) của mọi ô trong cột, cắt ngưỡng mỗi ô ở ~70 ký tự trước khi tính trung bình, rồi lấy căn bậc hai để giảm độ chênh lệch:

```python
import math
CAP, FLOOR, content_width = 70, 1000, content_width_twips
def col_weight(table, col_idx):
    lens = [min(len(row.cells[col_idx].text.strip()), CAP) for row in table.rows]
    mean = sum(lens) / len(lens) if lens else 6
    return math.sqrt(max(mean, 4))
# weights -> tỷ trọng -> nhân với content_width, clamp [FLOOR, 0.68*content_width],
# dồn phần dư làm tròn vào cột cuối, rồi set vào CẢ BA nơi: tblW, mọi gridCol, mọi tcW của mọi hàng.
```

Bắt buộc set độ rộng ở cả ba chỗ (`tblW`, từng `gridCol` trong `tblGrid`, từng `tcW` trong mọi ô) — chỉ sửa `tblGrid` mà quên `tcW` khiến các ô hiển thị lệch với khung bảng.

### 5.4. Dòng bảng vỡ chữ giữa trang

Một hàng dài (nhiều dòng chữ) có thể bị Word/LibreOffice cắt ngang giữa một từ khi hàng đó nằm đúng ranh giới trang, ví dụ `CalculateRepaymentResp` / `onse` tách làm hai trang. Chống bằng cách gắn `w:cantSplit` cho **mọi hàng của mọi bảng** ở bước cuối cùng trước khi lưu:

```python
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
for t in doc.tables:
    for row in t.rows:
        trPr = row._tr.get_or_add_trPr()
        if trPr.find(qn('w:cantSplit')) is None:
            trPr.append(OxmlElement('w:cantSplit'))
```

### 5.5. Header/footer/logo bằng python-docx

python-docx không có API field-code cấp cao cho số trang — phải tự dựng `w:fldChar`/`w:instrText` (begin → instrText " PAGE \* MERGEFORMAT " → separate → text tạm "1" → end; tương tự cho NUMPAGES). Nhớ `section.header.is_linked_to_previous = False` và tương tự cho footer trước khi thêm nội dung, nếu không nội dung sẽ không thật sự được lưu vào section.

### 5.6. Bảng "Mô tả/Độ ưu tiên/Actor..." (mục Yêu cầu chức năng) KHÔNG tô màu header

Khác với các bảng tra cứu khác trong tài liệu (từ viết tắt, business rule, validation rule, traceability matrix — có header tô navy), các bảng mô tả từng FR theo layout nhãn/giá trị thường **không** tô màu (`w:shd`) theo yêu cầu định dạng của công ty. Khi chạy bất kỳ script sửa độ rộng cột nào (Mục 5.3), tuyệt đối không đụng vào `w:shd` — chỉ set `tcW`. Sau khi sửa, kiểm tra lại bằng cách đọc `tcPr.find(qn('w:shd'))` của đúng nhóm bảng này để chắc chắn vẫn `None`/`auto`.

### 5.7. Sequence diagram — vẽ bằng matplotlib, đúng phong cách ảnh mẫu

Không dùng thư viện UML/SVG — vẽ trực tiếp bằng `matplotlib.patches` (rounded box cho actor, mũi tên `FancyArrowPatch` liền nét cho request/nét đứt cho response, đường lifeline đứt nét dọc từ mỗi actor) rồi `savefig(..., dpi=200)` ra PNG, chèn bằng `doc.add_picture(path, width=Inches(6))` kèm caption in nghiêng "Hình N – Sequence Diagram: ..." đánh số liên tục. Đối chiếu ảnh mẫu (`template-sequence.png`) để lấy đúng: 2 màu nền xen kẽ giữa các actor liền kề (không dùng cùng 1 màu cho mọi actor), khối tiêu đề (banner) phía trên, khối `alt`/`else` có viền màu cam khi mô tả nhánh rẽ.

### 5.8. Bảng "Bước thực hiện" — luôn đặt NGAY TRƯỚC ảnh diagram, không phải sau

Mỗi sequence diagram phải có kèm 1 bảng liệt kê từng bước, đặt **ngay trước ảnh** (không phải phía sau) để người đọc nắm luồng bằng chữ trước khi nhìn hình.

- Cột: `Bước` (mô tả đầy đủ nội dung từng mũi tên/tương tác) + 1 cột cho **mỗi actor thật của đúng diagram đó**, đặt tên cột đúng theo tên actor. Diagram 2 actor "CBQ" / "Hệ thống RLOS (...)" → cột `Hệ thống | Người thực hiện`. Diagram không có actor hệ thống (vd quy trình giấy As-Is giữa 2 tổ chức) → đặt tên 2 cột đúng theo 2 tổ chức đó, không ép cứng nhãn "Hệ thống". Ô của actor nào không tham gia bước đó thì để trống (không dùng dấu gạch ngang).
- Nội dung bảng phải chép/diễn giải **đúng từng bước đã vẽ trong chính ảnh diagram đó** — mở lại đúng file PNG đã render (không suy từ trí nhớ, không bịa thêm bước không có trên hình) để đối chiếu từng mũi tên, từng self-call nội bộ, từng nhánh `alt`/`else`.
- Kỹ thuật chèn đúng vị trí: `doc.add_table()`/`doc.add_paragraph()` của python-docx luôn nối vào **cuối** body, không chèn được giữa chừng trực tiếp — phải tạo ở cuối rồi "nhổ" ra và chèn lại đúng chỗ:

```python
anchor = next(p._p for p in doc.paragraphs if '<w:drawing' in p._p.xml)  # paragraph chứa ảnh
lead_el, tbl_el = build_lead_paragraph(...), build_table(...)   # dựng bằng doc.add_paragraph()/doc.add_table()
lead_el.getparent().remove(lead_el); tbl_el.getparent().remove(tbl_el)  # nhổ khỏi cuối body
anchor.addprevious(lead_el)   # gọi lead trước
anchor.addprevious(tbl_el)    # rồi gọi table — thứ tự cuối cùng: lead -> table -> ảnh
```

  Dùng biến giữ tham chiếu **element** (không phải index số nguyên) khi cần thao tác nhiều diagram trong 1 script — chèn/xoá ở diagram này không làm lệch vị trí index của các diagram khác vì tham chiếu element luôn đúng bất kể cây XML thay đổi chỗ khác.
- Nếu tài liệu đã có sẵn 1 đoạn/bảng mô tả bước tương tự nằm **sau** ảnh (từ lần soạn trước, trước khi có yêu cầu này), phải gỡ bỏ để tránh trùng lặp nội dung trước và sau cùng 1 ảnh: giữ tham chiếu trực tiếp tới phần tử đoạn/bảng đó rồi `el.getparent().remove(el)`.
- Bảng này dùng lại đúng hàm build bảng chung của tài liệu — tự động áp công thức chia cột theo nội dung (Mục 5.3) và `cantSplit` (Mục 5.4), không viết logic riêng.

## 6. Quy trình thực hiện

1. Đọc file chỉ dẫn tác vụ (Mục 3) — lập danh sách hạng mục định dạng cần đối chiếu cuối cùng.
2. Đọc **toàn bộ** nguồn nghiệp vụ (Mục 3) — không lấy mẫu, đối chiếu số liệu cụ thể sẽ trích dẫn.
3. Soạn nội dung theo đúng 17 mục của `PRM-BA-BRD-001.md`, gắn nhãn `(Đề xuất – BA suy luận)` / `[CẦN XÁC NHẬN]` nhất quán (Mục 4).
4. `unzip` file mẫu Word công ty, đọc font/màu/header/footer/logo thật (Mục 5.1).
5. Dựng `.docx`: nội dung + bảng + set font/màu theo đúng số liệu đã đọc ở bước 4 (style-level lẫn run-level).
6. Vẽ sequence diagram bằng matplotlib theo Mục 5.7, chèn vào đúng mục quy trình nghiệp vụ liên quan.
7. Với mỗi diagram, chèn bảng "Bước thực hiện" ngay trước ảnh theo Mục 5.8; gỡ đoạn/bảng mô tả bước cũ còn sót lại phía sau ảnh nếu trùng nội dung.
8. Ghép header/footer/logo từ file mẫu (Mục 5.5), set độ rộng bảng theo công thức Mục 5.3, gắn `cantSplit` (Mục 5.4).
9. **QA bằng render** (Mục 8) — bắt buộc, không bỏ qua dù python-docx mở lại không báo lỗi.
10. Sửa lỗi phát hiện được, lặp lại bước 9 cho tới khi sạch.
11. Dọn toàn bộ file rác dùng để QA, chỉ giữ lại `.docx` đích.

## 7. Cấu trúc nội dung bắt buộc

Theo đúng 17 mục + định dạng FR/BR/VR của `template/PRM-BA-BRD-001.md` — đọc file đó, không lặp lại ở đây. Điểm bổ sung riêng cho BRD tổng hợp đa nguồn: mục 1.5 "Tài liệu tham chiếu" phải liệt kê **tất cả** nguồn ở Mục 3 kèm vai trò tham chiếu của từng nguồn; mục 17 "Ma trận truy vết" phải nối được User Story (PRD) → FR → BR → Tiêu chí chấp nhận → nhóm test case trong bộ testcase hiện có.

## 8. QA bằng render — vòng lặp bắt buộc

python-docx mở lại file thành công **không** có nghĩa là file hiển thị đúng trong Word — bug ở Mục 5.2 và 5.4 chỉ lộ ra khi render thật. Quy trình:

1. `soffice --headless --convert-to pdf file.docx` (LibreOffice) để xuất PDF thật.
2. Dùng `pymupdf` (`pip install pymupdf`) render mỗi trang ra PNG; ghép toàn bộ trang thành **1 contact sheet** độ phân giải thấp (PIL, lưới N cột) để quét lỗi tổng quan trong 1 lần xem — tìm: cột chữ vỡ từng âm tiết (cột quá hẹp), bảng tràn lề phải (bug Mục 5.2), trang có khoảng trắng bất thường, thiếu header/footer/logo, tiêu đề bìa sai màu.
3. Với trang nghi vấn, render lại riêng ở độ phân giải cao để xem chi tiết (đặc biệt: trang cuối một bảng dài — kiểm tra hàng cuối có bị cắt ngang giữa từ khi sang trang không).
4. Sửa, lặp lại bước 1–3 tới khi sạch toàn bộ số trang.
5. Xoá hết file trung gian dùng để QA (`.pdf`, PNG preview, contact sheet, thư mục giải nén tạm) — chỉ nộp lại đúng 1 file `.docx` theo đường dẫn yêu cầu.

**Lưu ý môi trường Windows/Git Bash**: python hệ thống là Windows-native, không hiểu đường dẫn kiểu `/d/...` của Git Bash — luôn dùng đường dẫn `D:/...`. Console Windows dùng `cp1252`, in tiếng Việt trực tiếp sẽ vỡ `UnicodeEncodeError` — luôn chạy `PYTHONIOENCODING=utf-8 python3 ...` cho bất kỳ script debug nào có in tiếng Việt, hoặc ghi ra file UTF-8 rồi đọc lại bằng tool Read thay vì in ra console.

## 9. Quality check trước khi báo hoàn tất

- [ ] Đầy đủ 17 mục theo `PRM-BA-BRD-001.md`, không bỏ sót.
- [ ] Mọi số liệu/mã cụ thể (mã BR/US, số dòng testcase, tên tài khoản mẫu...) đã đối chiếu lại đúng nguồn, không suy từ trí nhớ.
- [ ] Không suy diễn liều lĩnh — mọi khoảng trống đã đánh dấu `[CẦN XÁC NHẬN]`/`(Đề xuất – BA suy luận)` nhất quán.
- [ ] Font/size, màu Heading, màu header bảng khớp đúng số liệu đọc từ file mẫu (không đoán).
- [ ] Header, footer, logo đầy đủ trên mọi trang, đúng logo lấy từ file mẫu.
- [ ] Mọi bảng vừa đúng chiều rộng trang, không bảng nào tràn lề (đã kiểm bằng công thức Mục 5.2).
- [ ] Bảng mô tả FR (Mô tả/Độ ưu tiên/Actor...) không tô màu; các bảng tra cứu khác có header tô màu theo brief.
- [ ] Không hàng bảng nào bị vỡ chữ giữa trang (đã gắn `cantSplit`).
- [ ] Sequence diagram đúng số lượng cần thiết, đúng tông màu xen kẽ actor theo ảnh mẫu, có caption đánh số liên tục.
- [ ] Mỗi diagram có đúng 1 bảng "Bước thực hiện" ngay **trước** ảnh (không phải sau), tên cột đúng theo tên actor thật của diagram đó, nội dung khớp chính xác từng bước trên hình; không còn đoạn/bảng mô tả bước trùng lặp sót lại sau ảnh.
- [ ] Đã render PDF và xem qua **toàn bộ số trang** (không chỉ vài trang đầu), không còn trang lỗi.
- [ ] Đã xoá sạch file rác dùng để QA, thư mục đích chỉ còn đúng 1 file `.docx`.

## 10. Output format

Xuất file `brd-<ten-chuc-nang>.docx` đúng đường dẫn yêu cầu. Báo lại: những lỗi định dạng đã phát hiện và sửa qua vòng QA render (nếu có), và danh sách các mục còn đánh dấu `[CẦN XÁC NHẬN]` để người dùng biết cần bổ sung thông tin gì trước khi trình ký/dùng chính thức.
