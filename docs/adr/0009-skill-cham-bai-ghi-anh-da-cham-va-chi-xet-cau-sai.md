# Skill chấm bài đẩy thẳng dấu, vòng khoanh và nhận xét lên MathShine, không xuất báo cáo

Thay một phần ADR 0007 theo yêu cầu của giáo viên (2026-10-27, cập nhật 2026-10-28).

- **Không báo cáo, không tổng hợp lớp.** Giáo viên chỉ cần bài được chấm và trả thẳng cho học sinh trên MathShine. Báo cáo chấm, `loi.json`, Tổng hợp lớp và đề xuất buổi chữa đã bỏ. Người chấm chỉ viết `cham.md`: một bảng câu (Đ/S, điểm, vị trí dấu, vòng khoanh) và nhận xét theo ảnh. Đây là đầu vào cho script, không ai đọc. Điểm đề xuất chỉ báo trong chat; giáo viên tự nhập điểm.
- **Chấm theo kết quả cuối.** Câu nào học sinh ra đúng kết quả cuối của Đáp án đã chốt thì ✓, đủ điểm, không xét lời giải. Chỉ câu sai (✘) mới đọc lời giải để tìm bước sai đầu tiên, cho điểm theo biểu điểm và gợi ý sửa. Học sinh giải cách khác mà sai thì người chấm tự giải theo cách đó để tìm chỗ sai.
- **Chốt đáp án nhẹ hơn.** Giáo viên đưa đáp án chuẩn thì dùng nguyên, không giải lại, không SymPy. Đáp án chưa chắc hoặc chỉ có đề thì chỉ kiểm kết quả cuối (SymPy, thay ngược). Câu lệch hay không chắc vẫn dừng để giáo viên chốt.
- **Ảnh đã chấm.** `danh_dau.py` đọc `cham.md` (`doc_cham.py`) và vẽ lên ảnh gốc giống bút "Vẽ" giáo viên vẫn dùng (màu `#ef4444`, nét 6px trên ảnh gốc, đầu nét tròn): ✓/✘ cạnh đáp số từng câu, và vòng đỏ khoanh bước sai đầu tiên của câu sai. Vị trí là tỉ lệ 0–1 theo chiều rộng và cao của ảnh. Script ra bản đẩy lên và các tấm ghép 2×2 để người chấm soát vị trí một lần. `day_anh.py` đẩy lên qua `POST /api/grading?action=uploadGraded`, ghi đè `submissionImages/<mã ảnh>.base64Data` giống hệt nút "Tải ảnh đã chấm" của trang chấm bài. Đẩy tự động, không chờ giáo viên duyệt (giáo viên yêu cầu).
- **Nhận xét theo ảnh đăng thẳng thành bình luận** (`dang_nhan_xet.py` → `POST /api/grading?action=postComment`), dưới tên và ảnh đại diện của giáo viên ra bài (`createdBy` của bài tập), không chờ duyệt. Mỗi câu sai một bình luận, như giáo viên thường viết; bình luận có thể chỉ tới "chỗ khoanh đỏ" thay vì trích lại công thức. Công thức được chuẩn hóa về `\(…\)` của MathShine. Bình luận có `source: 'cham-bai'`: chạy lại skill chỉ sửa đúng bình luận của skill (theo `da-dang.json`), không đăng trùng, không đụng bình luận giáo viên viết tay.
- **Giọng giáo viên.** Mẫu giọng văn (`giong-van.md`) chỉ lấy nhận xét của chính giáo viên ra bài (`voice&teacher=<uid>`), bỏ bình luận skill đã đăng để giọng không trôi dần theo chữ của Claude.
- **Ít token.**
  - Hướng dẫn chấm nằm sẵn trong agent `cham-bai` (sinh từ `cham-mot-bai.md` bằng `tools/dong_bo_agent.py`) để các subagent dùng chung bản lưu đệm.
  - Script cộng điểm (ô Điểm của câu ✓ và câu bỏ trống để trống) và kiểm mẫu `cham.md`.
  - `dap-an.md` ghi câu trắc nghiệm thành bảng, không chép đề.
  - Mẫu giọng văn cắt khoảng 300 ký tự mỗi mẫu.
  - Lỗi mạng chỉ in một dòng.
  - Mỗi subagent chỉ trả về một dòng. Phiên chính không tự chấm bài nào.
- **Chấm một lần, đẩy đến khi xong.** `day_len.py` đẩy ảnh rồi đăng bình luận, cả hai thành công mới ghi `xong.txt`. Bài đã có `cham.md` mà chưa có `xong.txt` thì lần chạy sau chỉ đẩy lại, không chấm lại. Chấm lại thì API không trả bình luận skill đã đăng làm ngữ cảnh, để người chấm viết lại từ đầu.
- **An toàn khi ghi đè.** MathShine không giữ ảnh gốc khi ghi đè, nên:
  - trước lần đẩy đầu, script chép ảnh gốc sang `goc-<i>.ban-dau.jpg` (không bao giờ ghi đè); `day_anh.py --khoi-phuc` đẩy lại được, và chấm lại (`lay_bai.py --lai`) dùng ảnh gốc này thay vì ảnh đã có dấu;
  - API chỉ ghi khi SHA-256 của ảnh trên server khớp bản skill đã lấy về hoặc đã đẩy lần trước, và ghi kèm precondition `updateTime`: giáo viên vừa vẽ hay tải ảnh khác thì không đè;
  - API chỉ nhận ảnh thuộc đúng Lần nộp, JPEG, data URL không quá 900KB (như `compressImage`).

## Considered Options

- **Lưu Ảnh đã chấm vào collection riêng `gradedImages`, giữ ảnh gốc**: an toàn hơn nhưng học sinh và trang chấm bài hiện chỉ hiển thị `submissionImages`, phải sửa giao diện cả hai phía. Để sau nếu cần giữ ảnh gốc trên server.
- **Giáo viên duyệt ảnh và bình luận trước khi đẩy**: an toàn hơn với dấu đặt lệch hay nhận xét chưa ổn, nhưng giáo viên muốn tự động. Thay bằng bước người chấm soát tấm ghép, lệnh khôi phục ảnh, và sửa bình luận bằng cách chạy lại.
- **Vẽ cả lời gợi ý lên ảnh**: chữ vẽ lên ảnh không chứa được công thức và dễ đè lên bài làm; gợi ý nằm ở bình luận, ảnh chỉ có dấu và vòng khoanh.

## Consequences

- Giáo viên không còn báo cáo để duyệt hay tổng hợp lớp để chuẩn bị buổi chữa. Những gì học sinh thấy là do skill quyết định; chỗ người chấm không chắc chỉ được báo trong chat ("cần xem").
- Bình luận skill đăng không tạo thông báo cho giáo viên khác (khác bình luận gửi từ trang chấm bài), vì người đăng chính là giáo viên ra bài.
- API không còn chỉ đọc: khóa chấm bài giờ ghi được ảnh bài làm và bình luận dưới tên giáo viên. Lộ khóa thì người khác đè được ảnh bài làm và đăng bình luận giả danh giáo viên; đổi khóa bằng cách đặt lại `GRADING_KEY_SHA256`.
- API ghi qua REST không xác thực, dựa vào luật Firestore đang cho ghi công khai `submissionImages`. Khi siết luật phải chuyển API sang service account (như ADR 0007).
- Dấu và vòng khoanh đặt theo vị trí Claude ước lượng trên ảnh, có thể lệch.
- Câu ra đúng kết quả cuối nhưng lời giải có chỗ sai hoặc thiếu bước vẫn được đủ điểm.
