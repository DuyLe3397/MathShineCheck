"""Ứng viên file đề/đáp án cho hộp thoại đầu vào: các file mới nhất, in gọn thay cho Glob (Glob in cả trăm đường dẫn).

  python ung_vien.py [số file, mặc định 4]

Tìm .docx, .pdf, .png, .jpg ở thư mục gốc repo (không vào thư mục con) và ~/Downloads; mỗi dòng một đường dẫn,
mới nhất trước.
"""
import sys
from pathlib import Path

EXT = {'.docx', '.pdf', '.png', '.jpg', '.jpeg'}


def main() -> None:
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    found = [f for folder in (Path.cwd(), Path.home() / 'Downloads') if folder.is_dir()
             for f in folder.iterdir() if f.is_file() and f.suffix.lower() in EXT and not f.name.startswith('~$')]
    for f in sorted(found, key=lambda f: -f.stat().st_mtime)[:n]:
        print(f)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
