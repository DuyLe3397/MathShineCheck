# Cài đặt và sửa lỗi (một lần trên mỗi máy)

- **Khóa chấm bài** — script tìm lần lượt: biến môi trường `MATHSHINE_GRADING_KEY`, file `~/.mathshine-grading-key`, file `<skill>/khoa.txt` (có khi skill được đóng gói kèm khóa). Không tìm thấy, hoặc API trả 401 (lộ ra ngay ở bước 0, khi chạy `lay_bai.py`): nhờ giáo viên tự tạo file `~/.mathshine-grading-key` chứa khóa (người chấm chạy song song cũng cần khóa, nên không truyền qua biến môi trường trong lệnh), rồi chạy lại `lay_bai.py`; Claude không tự ghi khóa vào file nào. Server giữ SHA-256 của khóa trong biến Vercel `GRADING_KEY_SHA256` (dự án `mathshine-email-api`).
- **Thư viện Python**: cần `sympy` và `Pillow`; thiếu thì `pip install sympy pillow`.
- **"cần deploy bản mới của email-api"** (do `day_len.py` báo): giáo viên deploy `email-api` lên Vercel, rồi chạy lại `python <skill>/scripts/day_len.py <dir> …` cho các thư mục bị lỗi.
- **Claude Desktop**: script cần gọi `mathshine-email-api.vercel.app`. Lỗi kết nối hoặc bị chặn tên miền thì chỉ giáo viên vào **Settings → Capabilities**, bật code execution và thêm tên miền đó vào danh sách được phép truy cập mạng.
