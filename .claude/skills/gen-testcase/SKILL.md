---
name: gen-testcase
description: Sinh hoặc cập nhật bộ test case (.xlsx) từ đoạn chat/implementation plan và source code thực tế của một chức năng đã làm, đúng cấu trúc/style file mẫu Excel, bao quát đủ nhóm case chuẩn (danh sách/tạo mới/sửa/popup/nghiệp vụ chung). Dùng khi người dùng yêu cầu viết/tạo/cập nhật testcase cho một chức năng.
---

# Sinh bộ test case từ đoạn chat / implementation plan

Đúc kết từ quá trình tạo và cập nhật `Testcase_nhansudaily.xlsx` (module Quản lý Nhân sự đại lý & Đào tạo).

## 1. Role

Bạn là **QA/Test Engineer** có kinh nghiệm viết test case cho hệ thống nghiệp vụ ngân hàng/tài chính (LOS/RLOS), dựa trên toàn bộ trao đổi nghiệp vụ và source code thực tế đã triển khai — không dựa trên suy đoán.

## 2. Mục tiêu

Sinh một file `Testcase_<ten_chuc_nang>.xlsx` có cấu trúc/style **giống hệt** file mẫu, bao quát đầy đủ các trường hợp của chức năng đã làm, không bỏ sót, không bịa nghiệp vụ chưa được xác nhận.

## 3. Input

- File mẫu bắt buộc dùng làm gốc: `template/template_testcase.xlsx`.
- Toàn bộ đoạn chat/implementation_plan/README của chức năng đang làm.
- Source code hiện tại (component FE, controller/service BE, package SQL) — dùng để xác nhận chính xác tên field, validate, tên nút, thông báo lỗi thật, không suy đoán từ trí nhớ.

**Prompt gốc thường dùng để khởi động:**
> Hi, tôi có `\template\template_testcase.xlsx`. Từ những trao đổi của tôi và bạn, bạn hãy cho tôi một bộ testcase có cấu trúc tương tự bao quát được hết các trường hợp, không bỏ sót. Xuất ra file excel: `Testcase_<ten_chuc_nang>.xlsx` trong cùng thư mục với module đang làm.

## 4. Quy tắc bắt buộc

- Không tự bịa nghiệp vụ/validation chưa được xác nhận trong chat hoặc trong code thực tế.
- Đọc lại **toàn bộ** đoạn hội thoại liên quan tới module trước khi liệt kê case — không chỉ đọc phần gần nhất.
- Nếu thiếu thông tin quan trọng để viết một case, bỏ qua case đó thay vì đoán — không tự dựng "Kết quả mong đợi" không có căn cứ.
- Tên field/nút/thông báo lỗi trong case phải khớp **đúng nguyên văn** với UI/code thực tế (kể cả dấu ngoặc kép, hoa/thường), không tự diễn giải lại.

## 5. Quy cách file Excel (bám theo `template_testcase.xlsx`)

- Cấu trúc cột theo đúng thứ tự: `Mã TC | Chủ đề | Phòng/ban sử dụng | Tên test case | Đường dẫn | Các bước thực hiện | Kết quả mong đợi | Dữ liệu test | Kết quả | Ghi chú | Số Bug | NSDL`.
- Header thông tin phía trên bảng (dòng 1-4): Chức năng/Dự án, Người tạo/PM, Ngày tạo/Kiểm thử trên hệ thống, dòng trống.
- Dòng 5 là header cột; dữ liệu bắt đầu từ dòng 6.
- **Mã TC** dùng công thức Excel thật (không phải text tĩnh): `=_xlfn.CONCAT($L$5,TEXT(L{row},"000"))` — cột L (NSDL) chứa prefix module ở ô L5, và số thứ tự tăng dần 1, 2, 3... từ dòng 6 trở đi ở chính cột L của mỗi dòng.
- **Style**: lấy nguyên từ 1 sheet mẫu trong `template_testcase.xlsx` bằng `copy.copy(cell._style)` (không tự gán font/màu mới) — áp dụng cho: ô label header, ô value header, ô header cột, ô dữ liệu. Copy luôn `column_dimensions` (độ rộng cột) và `tabColor`.
- Border mỏng đều 4 cạnh do style mẫu đã có sẵn, không cần set lại thủ công.
- `freeze_panes = "A6"` để cố định phần header khi cuộn.
- Row height co giãn theo số dòng xuống dòng (`\n`) trong "Các bước thực hiện"/"Kết quả mong đợi" — công thức tham khảo: `max(28, min(90, (so_dong_max + 2) * 13))`.
- Dùng **openpyxl** viết bằng script Python độc lập, không sửa tay trực tiếp trong Excel.

## 6. Quy trình thực hiện

1. **Đọc lại** toàn bộ chat + implementation_plan + source code liên quan (FE + BE + SQL) để nắm đúng field, validate, nút, luồng nghiệp vụ thực tế — kể cả các bug đã từng phát sinh và đã fix trong quá trình code (dùng làm case regression).
2. **Liệt kê "Chủ đề"** — thường mỗi Chủ đề tương ứng 1 màn hình hoặc 1 nhóm chức năng con, sắp xếp theo luồng sử dụng tự nhiên: Danh sách → Tạo mới → Chỉnh sửa → Xóa → chức năng phụ (tab con, popup con)... → Nghiệp vụ & ràng buộc chung (đặt cuối cùng).
3. Với mỗi Chủ đề, liệt kê đủ các nhóm case bắt buộc ở **Mục 7** — không bỏ nhóm nào áp dụng được cho màn hình đó.
4. Viết script Python (openpyxl) generate file; **kiểm tra file đích có đang mở trong Excel không** (tìm file khóa `~$<tenfile>` cùng thư mục) trước khi ghi đè — nếu đang mở, báo người dùng đóng lại rồi mới ghi.
5. Chạy thử script, đọc lại tổng số case + vài dòng đầu/cuối để xác nhận không lỗi encode tiếng Việt/style trước khi báo hoàn tất.

## 7. Nhóm test case bắt buộc bao quát

### Màn hình Danh sách
- Hiển thị mặc định (đủ cột, dữ liệu ban đầu).
- STT hiển thị đúng thứ tự bắt đầu từ 1 (bug thường gặp: bắt đầu từ 0 do quên gán Stt trong tầng repository).
- Phân trang.
- Tìm kiếm theo từ khóa: khớp một phần, không phân biệt hoa/thường, và trường hợp không tìm thấy (hiển thị "Không có dữ liệu", không lỗi hệ thống).
- Từng điều kiện lọc riêng lẻ + kết hợp nhiều điều kiện cùng lúc (AND).
- Dropdown lọc phụ thuộc lẫn nhau nếu có (vd chọn A lọc lại danh sách B tương ứng, đổi A sau khi đã chọn B không hợp lệ thì B tự xóa).
- Mặc định của các trường lọc đặc biệt (vd khoảng ngày mặc định = hôm nay trừ N tháng → hôm nay) nếu có.
- Nút **LÀM MỚI** đưa toàn bộ bộ lọc về đúng mặc định (không phải về rỗng nếu mặc định vốn có giá trị).
- Vị trí/thứ tự các nút thao tác đúng chuẩn UI dùng chung toàn hệ thống (vd LÀM MỚI → TÌM KIẾM → Tạo mới, căn phải).
- Nút **Tạo mới** điều hướng đúng màn hình (chế độ tạo mới, không kèm id).
- Icon **Sửa** điều hướng đúng bản ghi đã chọn.
- Icon **Xóa** → popup xác nhận → Đồng ý xóa thành công (xóa mềm, không xóa vật lý) / Hủy không đổi gì.
- Cột dữ liệu join/tính toán hiển thị đúng (tên hiển thị theo mã, badge trạng thái đúng màu).
- Bản ghi thiếu dữ liệu liên kết (FK null) vẫn hiển thị được, không bị loại do LEFT JOIN.

### Màn hình Chi tiết – Tạo mới
- Giao diện mặc định khi vào màn hình tạo mới (tiêu đề, giá trị mặc định từng field, field nào ẩn/hiện theo chế độ).
- Bắt buộc nhập từng field required (để trống → báo đúng thông báo lỗi, không cho lưu) — viết **1 case riêng cho từng field** required, không gộp chung.
- Giới hạn độ dài từng field có `maxlength`.
- Định dạng riêng từng field có validate đặc thù (email, số điện thoại, mã không chứa ký tự đặc biệt...).
- Trùng khóa chính/mã đã tồn tại → báo lỗi rõ ràng, không tạo bản ghi trùng.
- Field phụ thuộc field khác (chọn A tự động điền/tự động lọc B; đổi lại A cập nhật lại B).
- Ràng buộc chéo giữa 2 field cùng loại (vd ngày bắt đầu/ngày kết thúc: chọn 1 bên tự disable phía không hợp lệ ở bên kia).
- Upload file: sai định dạng bị chặn, đúng định dạng lưu thành công, vượt dung lượng bị chặn (nếu có giới hạn).
- Checkbox/switch phụ (bật/tắt lưu đúng giá trị tương ứng).
- Lưu hợp lệ với đầy đủ thông tin → thành công, điều hướng đúng, dữ liệu xuất hiện đúng trong danh sách.
- Nút **Đóng** không lưu dữ liệu, không tạo bản ghi mới.

### Màn hình Chi tiết – Chỉnh sửa
- Tải đúng dữ liệu đã lưu khi vào màn hình sửa (đủ field, không bị trống dù field đang disable).
- Field khóa không cho sửa (vd mã chính).
- Không bắt buộc nhập lại field chỉ bắt buộc lúc tạo mới (vd mật khẩu).
- Sửa và lưu thành công, dữ liệu cập nhật đúng.
- Kiểm soát đồng thời lạc quan (vd cột MOD_NO) nếu có — 2 người cùng sửa, người lưu sau bị báo lỗi thay vì ghi đè âm thầm.
- Đổi field cha cập nhật lại field con phụ thuộc (tương tự lúc tạo mới).
- Giữ nguyên dữ liệu cũ khi không đổi (vd không chọn file mới thì file cũ không bị mất/null).
- Dữ liệu liên quan hiển thị đúng ở bảng con/tab con, kể cả trường hợp rỗng ("Chưa có dữ liệu").
- Nếu màn hình có dạng tab (thông tin chính + dữ liệu liên quan): tab dữ liệu liên quan hiển thị đúng thông báo khi bản ghi cha chưa được lưu (chưa có id).

### Popup con (nếu có, vd popup thêm/gán quan hệ, popup cập nhật 1 dòng trong bảng con)
- Mở popup đúng ngữ cảnh (dữ liệu hiện tại của dòng/bản ghi được chọn).
- Tìm kiếm/lọc bên trong popup (nếu có).
- Chọn 1 hoặc nhiều bản ghi (nếu hỗ trợ chọn nhiều — nút xác nhận disable khi chưa chọn gì, hiển thị đúng số lượng đã chọn).
- Xác nhận thao tác thành công, báo đúng số lượng thành công/thất bại nếu xử lý hàng loạt.
- Trường hợp trùng/đã tồn tại trong lô chọn nhiều: các bản ghi hợp lệ vẫn được xử lý, chỉ báo lỗi riêng cho bản ghi trùng.
- Hủy/đóng popup không lưu thay đổi.
- Nếu popup có quản lý file: chọn file sai định dạng/quá dung lượng bị chặn; xem/tải file đã có; đánh dấu xóa file chỉ áp dụng thật khi Lưu (không xóa ngay khi bấm nút xóa trên giao diện).

### Nghiệp vụ & ràng buộc chung
- Chặn thao tác phá vỡ ràng buộc liên kết (vd xóa bản ghi cha khi còn bản ghi con phụ thuộc).
- Tìm kiếm/phân trang lặp nhiều lần, kết hợp nhiều điều kiện liên tục không phát sinh lỗi hệ thống — case regression riêng cho từng bug hệ thống đã từng gặp và đã fix trong lúc code (vd ORA-00918 column ambiguously defined, PLS-00306 wrong number of arguments, lỗi cast kiểu dữ liệu khi lấy tham số OUT...).
- Tách biệt dữ liệu module này với module dùng chung khác nếu nghiệp vụ yêu cầu tách biệt (vd nhân sự riêng của module không lẫn với danh sách user hệ thống).

## 8. Lưu ý khi chức năng có thay đổi sau khi đã có testcase

- **Không tạo file mới tràn lan** — cập nhật lại đúng các case bị ảnh hưởng bởi thay đổi, thêm case mới cho phần vừa thay đổi/UI vừa thêm, giữ nguyên toàn bộ case cũ vẫn còn đúng.
- Luôn kiểm tra file đích có đang mở trong Excel không trước khi ghi đè; nếu đang mở, dừng lại và báo người dùng đóng file trước — không cố ghi đè khi file đang khóa.

## 9. Quality check trước khi báo hoàn tất

- [ ] Không bỏ sót nhóm case bắt buộc ở Mục 7 cho từng màn hình áp dụng được.
- [ ] Không có case suy diễn nghiệp vụ chưa được xác nhận trong chat/code.
- [ ] Số thứ tự Mã TC/NSDL liên tục, không trùng, không nhảy số, công thức Mã TC chạy đúng khi mở lại bằng Excel thật.
- [ ] Style/format khớp file mẫu (mở thử không lỗi font/encode tiếng Việt, không lệch màu header/border).
- [ ] Tên field/nút/thông báo lỗi trong case khớp đúng nguyên văn với UI/code thực tế.

## 10. Output format

Xuất file `Testcase_<ten_chuc_nang>.xlsx` trong cùng thư mục với module đang làm. Sau khi chạy xong, báo lại: tổng số test case, và nếu là lần cập nhật — số case mới thêm/số case đã sửa lại so với lần trước.
