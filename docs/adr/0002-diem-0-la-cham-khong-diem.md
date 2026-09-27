# Điểm 0 nghĩa là Chấm không điểm

Giáo viên cần chấm một Lần nộp (xem bài, viết Nhận xét chung) mà không cho điểm, và muốn học sinh lẫn giáo viên thấy "-" thay vì một con số. Chúng tôi giữ nguyên luồng nhập hiện có: giáo viên nhập điểm 0, và mọi nơi đọc `Grade.scoreValue === 0` đều hiểu là **Chấm không điểm**, tức không có điểm. Không đổi cấu trúc dữ liệu, không thêm trường mới.

## Considered Options

- **Thêm ô "Không cho điểm" riêng (trường cờ hoặc `scoreValue = null`)**: vẫn giữ được điểm 0 thật, nhưng phải đổi trang chấm, đổi dữ liệu và quyết định lại cho các điểm 0 cũ. Bị loại vì giáo viên không bao giờ cho điểm 0 thật và muốn giữ thao tác nhập 0 quen thuộc.

## Consequences

- Hệ thống không còn biểu diễn được điểm 0 thật. Muốn có lại thì phải chuyển sang một trường riêng, và không phân biệt được các điểm 0 đã lưu trước đó.
- Mọi điểm 0 đã chấm từ trước tự động trở thành Chấm không điểm.
- Mọi chỗ hiển thị hoặc tính điểm (điểm trung bình, điểm cao nhất, Độ đủ điểm) phải loại điểm 0; bài chỉ có Chấm không điểm là Bài thiếu điểm.
- Lần nộp Chấm không điểm vẫn có trạng thái "Đã chấm".
