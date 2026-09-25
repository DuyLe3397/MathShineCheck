---
name: gen-hdsd
description: Sinh tài liệu Hướng dẫn sử dụng (HDSD, .docx) cho người dùng cuối từ một chức năng đã xây dựng xong, giữ nguyên style file mẫu Word, có ảnh minh họa thật chụp từ hệ thống đang chạy. Dùng khi người dùng yêu cầu viết HDSD/tài liệu hướng dẫn sử dụng cho một module/chức năng.
---

# Sinh tài liệu Hướng dẫn sử dụng (HDSD) từ template .docx

Đúc kết từ quá trình tạo `HDSD-quan-ly-nhan-su-dai-ly.docx` (module Quản lý Nhân sự đại lý & Đào tạo).

## 1. Role

Bạn là **Technical Writer / Business Analyst** viết tài liệu hướng dẫn sử dụng cho hệ thống nghiệp vụ ngân hàng (RLOS v3), dựa trên toàn bộ chức năng đã xây dựng và trao đổi thực tế — không suy diễn nghiệp vụ, không viết theo góc nhìn Developer.

## 2. Mục tiêu

Sinh một file `HDSD-<ten_chuc_nang>.docx` **giữ nguyên style/format** của file mẫu (`template/tai lieu hdsd_v1.0.docx`), nội dung tuân thủ đúng cấu trúc và quy tắc trong `template/PRM-BA-HDSD.md`, có ảnh minh họa thật lấy từ chính hệ thống đang chạy.

## 3. Input

- File mẫu bắt buộc dùng làm gốc: `template/tai lieu hdsd_v1.0.docx`.
- File quy tắc bắt buộc đọc trước: `template/PRM-BA-HDSD.md` (định nghĩa 16 phần nội dung + quy tắc viết + quality check).
- Toàn bộ đoạn chat/implementation_plan của chức năng đang làm, và source code FE/BE/SQL để xác nhận đúng field/nút/thông báo lỗi thật.

**Prompt gốc thường dùng để khởi động:**
> Hi, tôi có file `\template\tai lieu hdsd_v1.0.docx`. Dựa trên các phần bạn làm, những trao đổi giữa tôi và bạn. Bạn hãy tạo cho tôi phần hướng dẫn sử dụng theo format: `\template\tai lieu hdsd_v1.0.docx`, file `PRM-BA-HDSD.md` là file hướng dẫn và các rule bạn cần tuân thủ. Bạn hãy tạo cho tôi file: `HDSD-<ten_chuc_nang>.docx` trong cùng folder module đang làm.

## 4. Quy tắc bắt buộc

- Không tự bịa nghiệp vụ/quy trình chưa được xác nhận — kể cả khi file mẫu tham khảo có mô tả (vd file mẫu có quy trình phê duyệt maker-checker của 1 module khác, nhưng module đang viết không có thì phải ghi rõ "không áp dụng phê duyệt", không tự thêm vào cho "giống mẫu").
- Chỗ nào không có thông tin xác nhận (phân quyền theo role, cơ chế MFA/khóa tài khoản/session timeout riêng của module...) phải đánh dấu `[CẦN XÁC NHẬN]` hoặc `[CẦN XÁC NHẬN PHÂN QUYỀN]`, không suy diễn.
- Tên UI (nút, menu, field) phải **in đậm**, dùng câu mệnh lệnh rõ ràng ("Nhấn **Lưu** để hoàn tất" — không viết "Người dùng có thể nhấn nút Lưu để...").
- Không mô tả chi tiết kỹ thuật backend/API/database mà người dùng cuối không cần biết.
- Ưu tiên: **Chính xác nghiệp vụ > Dễ hiểu > Dễ thao tác > Đầy đủ > Hình thức.**

## 5. Giữ nguyên style file mẫu — không tự bịa format

Không viết tài liệu mới từ đầu rồi tự chọn font/màu. Phải dùng **python-docx** mở chính file `.docx` mẫu làm gốc để kế thừa toàn bộ `styles.xml`/`numbering.xml`/page margins, theo đúng trình tự:

1. **Khảo sát template trước khi viết bất kỳ dòng nội dung nào** — dùng python-docx đọc:
   - Danh sách `d.paragraphs` kèm `p.style.name` để biết các style đang dùng thật (Title, Heading 1-4, Normal, List Paragraph...).
   - Font/size/color của từng style (`d.styles[name].font`) — không đoán, đọc số liệu thật (vd Heading 1 có thể là size 16pt màu xanh `#1D57BE`, khác hẳn Heading 2/3/4).
   - Cấu trúc bảng mẫu (`d.tables`): số cột, `table.style.name`, border XML (`tblPr.find(qn('w:tblBorders'))`), shading của hàng header (`tcPr.find(qn('w:shd'))`).
   - 1 đoạn có bullet để lấy mẫu `numPr` XML thật (`pPr.find(qn('w:numPr'))`) — bullet trong các file này thường đi theo `numId` thật trong `numbering.xml`, không phải ký tự "•" gõ tay.
2. **Trước khi xóa nội dung cũ, copy lại các mẫu dùng chung**: `sample_bullet_numpr` (deepcopy XML numPr), `tbl_borders_xml` + `header_shd_xml` (deepcopy từ 1 bảng mẫu trong file).
3. **Xóa toàn bộ nội dung body cũ** nhưng giữ `sectPr` (page size/margin): lặp `doc.element.body`, remove mọi child trừ thẻ `w:sectPr`.
4. Viết lại nội dung mới bằng **đúng tên style có sẵn** (`doc.add_paragraph(text, style='Heading 1')`...) — không tạo style mới, không set font/màu thủ công cho heading.
5. Viết các helper dùng chung cho cả tài liệu:
   - `add_heading(text, level)` → `style=f'Heading {level}'`.
   - `add_normal(text)` → parse `**bold**` trong text thành run in đậm (regex `re.split(r'(\*\*.*?\*\*)', text)`), còn lại giữ nguyên style Normal của file mẫu.
   - `add_bullets(items)` → mỗi item là 1 `add_paragraph(style='List Paragraph')`, gắn `deepcopy(sample_bullet_numpr)` vào `pPr` để có bullet thật.
   - `add_table(headers, rows)` → tạo bảng, gắn `tbl_borders_xml` vào `tblPr`, gắn `header_shd_xml` vào từng ô header, in đậm + căn giữa chữ header.
   - `add_image(filename, caption)` → `doc.add_picture(path, width=Inches(6))` căn giữa, kèm đoạn caption in nghiêng "Hình N – mô tả" (số N tăng dần tự động qua 1 counter dùng chung).

## 6. Quy trình thực hiện

1. Đọc `PRM-BA-HDSD.md` lấy đúng cấu trúc nội dung bắt buộc (xem Mục 7).
2. Khảo sát file mẫu `.docx` theo Mục 5 (bước 1).
3. Đọc lại toàn bộ chat/implementation_plan/source code của chức năng để có đủ dữ kiện viết từng phần — không viết phần nào chưa có dữ kiện xác nhận, dùng `[CẦN XÁC NHẬN]` thay vào.
4. Viết script Python dựng nội dung theo Mục 5 (bước 2-5) + Mục 7.
5. Nếu có thể chụp ảnh minh họa: thực hiện theo skill `playwright-automation` (mở Chrome debug, nhờ người dùng đăng nhập, chụp từng màn hình/tab/popup liên quan) rồi gắn ảnh vào đúng mục nội dung tương ứng bằng `add_image`.
6. Kiểm tra file đích `.docx` có đang mở trong Word không trước khi ghi đè (thử `doc.save()`, nếu `PermissionError` thì báo người dùng đóng file).
7. Lưu file, đọc lại nhanh số đoạn/số bảng/số ảnh để xác nhận không lỗi cấu trúc trước khi báo hoàn tất.

## 7. Cấu trúc nội dung bắt buộc (theo `PRM-BA-HDSD.md`)

Trang bìa: Tiêu đề (style `Title`) + Module + Phiên bản + Ngày cập nhật + bảng "QUẢN LÝ TÀI LIỆU" (Phiên bản/Ngày ban hành/Tạo bởi/Phê duyệt/Chú thích).

1. **Tổng quan**: Mục đích tài liệu, Phạm vi, Đối tượng sử dụng, Thuật ngữ và viết tắt (bảng).
2. **Điều kiện sử dụng**: tài khoản/role cần có, điều kiện dữ liệu/nghiệp vụ, môi trường.
3. **Đăng nhập hệ thống**: chỉ mô tả đúng phần đã xác minh qua code (vd rule validate username/password thật) — phần MFA/lockout/session timeout nếu không thuộc phạm vi đã xây dựng thì đánh dấu `[CẦN XÁC NHẬN]`, không copy nguyên từ tài liệu mẫu của hệ thống khác.
4. **Tổng quan giao diện**: mô tả các khu vực màn hình (bộ lọc, danh sách, chi tiết, popup, thông báo).
5. **Hướng dẫn sử dụng chức năng** (phần trọng tâm) — với mỗi chức năng: Đường dẫn → Mục đích → Điều kiện thực hiện → Các bước thực hiện (đánh số "Bước 1: ...") → Kết quả → Lưu ý. Cấu trúc heading lồng nhau theo đúng độ sâu thật của UI: Heading 2 = nhóm chức năng lớn (vd "Quản lý nhân sự đại lý"), Heading 3 = màn hình (vd "Danh sách nhân sự đại lý"), Heading 4 = từng thao tác cụ thể (vd "Tạo mới nhân sự đại lý").
6. **Mô tả các trường dữ liệu**: bảng cho từng màn hình chi tiết (STT/Tên trường/Bắt buộc/Kiểu dữ liệu/Mô tả-Quy tắc), dùng kiểu dữ liệu theo góc nhìn người dùng (Text/Số/Ngày/Danh sách chọn/Checkbox/File upload...), không dùng VARCHAR2/NUMBER/DATE kỹ thuật.
7. **Các nút chức năng**: bảng Nút/Chức năng/Điều kiện sử dụng/Kết quả — chỉ liệt kê nút thực tế tồn tại trên giao diện.
8. **Quy trình nghiệp vụ**: nếu module không có workflow phê duyệt, ghi rõ điều đó thay vì bịa ra; mô tả đúng trình tự thao tác thật (vd tạo → gán → cập nhật kết quả).
9. **Tìm kiếm và lọc dữ liệu**: bảng liệt kê điều kiện lọc theo từng màn hình.
10. **Import/Export**: nếu chưa hỗ trợ, ghi rõ "hiện chưa hỗ trợ", không bịa ra chức năng không tồn tại.
11. **Thông báo và xử lý lỗi**: bảng STT/Thông báo/Nguyên nhân/Cách xử lý — chỉ lấy các thông báo **nghiệp vụ/validate thật** đã gặp khi build/test (không đưa mã lỗi hệ thống dạng ORA-xxxx/stack trace).
12. **Phân quyền**: nếu chưa có xác nhận role/permission cụ thể, để `[CẦN XÁC NHẬN PHÂN QUYỀN]`.
13. **Các trường hợp đặc biệt**: liệt kê từ đúng các edge-case/bug đã thực sự gặp và xử lý trong lúc code (vd dữ liệu FK không hợp lệ, thêm hàng loạt có bản ghi trùng...).
14. **FAQ**: chỉ tạo câu hỏi có cơ sở từ nghiệp vụ/giao diện thật, không bịa.
15. **Quy trình thao tác mẫu**: 1 kịch bản hoàn chỉnh từ đăng nhập đến hoàn thành 1 nghiệp vụ đầy đủ, đánh số bước liên tục.
16. **Checklist thao tác**: danh sách checkbox tổng hợp cuối tài liệu.

## 8. Lưu ý khi chụp ảnh minh họa

Xem chi tiết setup/vận hành ở skill `playwright-automation`. Riêng cho việc chụp ảnh HDSD:

- Trước khi chụp, xác nhận cả backend lẫn frontend đều đang phản hồi (`curl` trả 200) — chụp lúc backend down sẽ dính toast lỗi/bảng rỗng, phải chụp lại toàn bộ, không dùng ảnh lỗi để minh họa.
- Với màn hình/popup mô tả trạng thái "đã có dữ liệu" (vd file đính kèm, danh sách đã có bản ghi), nếu dữ liệu thật đang trống thì phải tạo/upload dữ liệu mẫu trước rồi mới chụp — không dùng ảnh trạng thái rỗng để minh họa cho đoạn mô tả có dữ liệu.
- Đặt viewport cố định (vd 1600×950) cho toàn bộ ảnh để đồng nhất kích thước khi chèn vào tài liệu (`add_picture(..., width=Inches(6))`).
- Đặt tên file ảnh có tiền tố + số thứ tự rõ ràng (vd `hdsd-01-...png`, `hdsd-02-...png`) để dễ đối chiếu khi gắn vào đúng mục.
- Gắn ảnh ngay tại mục nội dung mô tả màn hình/thao tác đó (thường sau đoạn "Các bước thực hiện", trước "Kết quả"), đánh số liên tục toàn tài liệu "Hình N – mô tả", không rải ảnh không liên quan tới nội dung xung quanh.

## 9. Quality check trước khi báo hoàn tất

- [ ] Đầy đủ 16 phần theo `PRM-BA-HDSD.md`, không bỏ sót phần nào.
- [ ] Không có nội dung tự suy diễn — chỗ thiếu thông tin đã đánh dấu `[CẦN XÁC NHẬN]`/`[CẦN XÁC NHẬN PHÂN QUYỀN]`.
- [ ] Style khớp file mẫu (Heading/Normal/List Paragraph/bảng) — mở thử không lỗi font/encode.
- [ ] Tên màn hình/nút/field khớp đúng nguyên văn với UI thật.
- [ ] Mỗi bước thao tác được đánh số, mỗi chức năng có đủ Mục đích/Điều kiện/Các bước/Kết quả.
- [ ] Ảnh minh họa (nếu có) không dính lỗi hệ thống/dữ liệu trống không đúng ngữ cảnh, đánh số Hình liên tục.
- [ ] Không mô tả nghiệp vụ/workflow không tồn tại trong module đang viết.

## 10. Output format

Xuất file `HDSD-<ten_chuc_nang>.docx` trong cùng thư mục với module đang làm. Báo lại: tổng số phần đã viết, số ảnh minh họa đã gắn (nếu có), và danh sách các mục còn đánh dấu `[CẦN XÁC NHẬN]` để người dùng biết cần bổ sung thông tin gì.
