# Trợ lý chấm bài: skill Claude Code trên máy giáo viên + API chỉ đọc

Giáo viên muốn Claude chấm bài Toán viết tay: đưa đề (± đáp án) và đường dẫn chấm bài hoặc Chi tiết bài tập, Claude đọc ảnh bài làm, so với đáp án, chỉ lỗi từng câu và gợi ý sửa. Giai đoạn này **Claude chỉ đọc MathShine và xuất Báo cáo chấm** cho giáo viên; giáo viên duyệt rồi tự dán nhận xét và cho điểm.

- **Skill `/cham-bai`** (`.claude/skills/cham-bai/`) chạy trong Claude Code trên máy giáo viên, dùng gói Claude Pro sẵn có. Gói Pro không gồm Claude API (xem `docs/research/ai-cham-bai-tu-dong.md`). Chạy trong Claude Code thì giáo viên luôn ngồi trước máy và mỗi lần chạy do giáo viên ra lệnh.
- **API chỉ đọc** `GET /api/grading` trong dự án Vercel `mathshine-email-api` (`email-api/api/grading.js`). API nhận đường dẫn, trả về bài tập, các Lần nộp cần chấm, từng ảnh, bình luận của giáo viên và học sinh theo từng ảnh (kèm ảnh đính kèm và Ghi chú ảnh), và khoảng 30 nhận xét cũ của giáo viên làm mẫu giọng văn. Bình luận theo ảnh là ngữ cảnh khi chấm (ảnh này là câu nào, phần nào làm lại, giáo viên đã dặn gì); căn cứ chấm vẫn là bài làm và Đáp án đã chốt. Xác thực bằng khóa riêng của giáo viên; server chỉ giữ SHA-256 của khóa (`GRADING_KEY_SHA256`).
- "Cần chấm" khớp đúng trang Chi tiết bài tập: Lần nộp hiện dòng vàng "Đã nộp" (chưa có điểm) thì chấm, dòng xanh "Đã chấm" thì bỏ qua. `email-api/lib/grading.js` chép lại logic `buildRows`; sửa bên này thì sửa cả bên kia.
- **Đáp án đã chốt** trước khi chấm. Claude tự giải độc lập mọi câu (kể cả khi đã có đáp án) và kiểm bằng SymPy. Câu nào lệch hoặc không chắc thì dừng để giáo viên chốt. Biểu điểm theo đáp án, hoặc Claude đề xuất để giáo viên duyệt một lần cho cả bài tập. Đã chốt trong một phiên thì các đường dẫn sau của cùng bài tập trong phiên đó được chấm luôn, không rà soát hay hỏi lại. Đáp án chốt từ phiên trước thì hỏi giáo viên dùng lại hay làm lại.
- Skill chỉ chạy khi đủ đầu vào: luôn cần đường dẫn; cần đề, trừ khi bài tập đó đã có đáp án chốt trong phiên. Thiếu thì hỏi và dừng chờ.
- Ảnh được làm nét nhẹ trên máy (`scripts/lay_bai.py`): bỏ bóng nền, đẩy nền giấy về trắng, làm sắc nét, giữ màu. Không tăng tương phản cục bộ (CLAHE) vì làm nổi chữ hằn từ mặt sau trang vở. Ảnh gốc được giữ để đối chiếu và phóng to chỗ khó đọc.
- Sau khi chấm, skill gộp mọi bài của bài tập (cả các lần chạy trước) thành Tổng hợp lớp: đánh giá từng bạn, lỗ hổng chung, đề xuất buổi chữa (chữa câu nào, chữa gì, ví dụ từ bài làm thật, bài luyện thêm). Mỗi bài có `loi.json` gọi tên lỗ hổng theo kiến thức để gộp được giữa các bạn.
- Chấm cả lớp: mỗi Lần nộp một subagent, 3 bài song song. Báo cáo lưu trong `cham-bai/` (git bỏ qua vì có tên và bài làm học sinh). Bài đã có báo cáo thì lần chạy sau bỏ qua, nên bị ngắt vì hết hạn mức thì chạy lại là chấm tiếp.

## Considered Options

- **Claude API trả theo token, chạy tự động trên server**: không cần giáo viên ngồi máy, nhưng tốn tiền riêng ngoài gói Pro. Để dành khi số bài vượt hạn mức gói Pro.
- **Script trên máy dùng khóa quản trị Firebase (service account)**: không cần server, nhưng máy nào chạy skill cũng giữ một khóa có toàn quyền dữ liệu. Bị loại.
- **Skill đọc thẳng Firestore không cần khóa**: chạy được ngay vì luật Firestore đang cho đọc công khai, nhưng sẽ hỏng khi siết luật. Bị loại để không xây thêm lên lỗ hổng đó.
- **Ghi luôn bình luận ẩn lên MathShine**: cần trước hết siết luật Firestore (hiện ai cũng đọc được `comments`, `grades`, ảnh bài làm và ai cũng tự đăng ký thành giáo viên được), thêm vùng bản nháp và màn hình duyệt. Để giai đoạn sau.

## Consequences

- Giáo viên chép nhận xét và điểm vào MathShine bằng tay. Nhận xét soạn sẵn viết công thức dạng `\(…\)` nên dán vào là hiện đúng.
- API đọc Firestore qua REST không xác thực, giống `notify.js`. **Khi siết luật Firestore phải chuyển API sang service account**, nếu không skill sẽ không lấy được bài.
- Ảnh bài làm MathShine lưu ở cạnh ngắn 720px (đã nén khi nộp). Chữ nhỏ, chỉ số và dấu mũ có thể khó đọc; skill phóng to vùng khó đọc và đánh dấu "cần xem" thay vì đoán.
- Chính sách sử dụng của Anthropic có nhóm rủi ro cao về giáo dục: khi thuộc nhóm đó, phải có người có chuyên môn duyệt và người bị ảnh hưởng phải được cho biết có dùng AI. Thiết kế này luôn để giáo viên duyệt. Việc thông báo cho học sinh do giáo viên và nhà trường quyết định.
