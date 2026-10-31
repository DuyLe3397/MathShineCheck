"""Đẩy một Lần nộp đã chấm lên MathShine: Ảnh đã chấm (day_anh.py) rồi nhận xét theo ảnh (dang_nhan_xet.py).

  python day_len.py <thư mục bài nộp> [<thư mục bài nộp> …]

Cả hai thành công thì ghi xong.txt — lay_bai.py dựa vào đó để không chấm lại bài này. Có lỗi thì không ghi, lần sau
lay_bai.py đưa bài vào `dayLai` để chỉ chạy lại lệnh này, không phải chấm lại. Chạy lại an toàn: không đẩy lại ảnh
không đổi, không đăng trùng bình luận. Mã thoát 1 nếu còn lỗi.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dang_nhan_xet  # noqa: E402
import day_anh  # noqa: E402


def main() -> None:
    bad = 0
    for arg in sys.argv[1:]:
        d = Path(arg)
        (d / 'xong.txt').unlink(missing_ok=True)
        failed = day_anh.run(d) + dang_nhan_xet.run(d)
        if failed:
            bad += 1
        else:
            (d / 'xong.txt').write_text('ok\n', encoding='utf-8')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
