"""Cắt phóng to một vùng của ảnh bài làm để đọc kỹ chỗ chữ khó đọc.

  python phong_to.py <ảnh> <x1> <y1> <x2> <y2> [--out vung.png]

Tọa độ theo tỉ lệ 0–1 của chiều rộng/cao ảnh (vd. 0 0.5 1 0.75 = dải ngang từ giữa tới 3/4 ảnh).
Vùng được nới thêm 5% mỗi phía và phóng sao cho cạnh dài khoảng 1600px. In ra đường dẫn ảnh vừa cắt.
"""
import argparse
import sys
from pathlib import Path

import cv2


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('box', nargs=4, type=float)
    ap.add_argument('--out')
    a = ap.parse_args()
    img = cv2.imread(a.image)
    if img is None:
        sys.exit(f'Không đọc được ảnh {a.image}')
    h, w = img.shape[:2]
    x1, y1, x2, y2 = a.box
    pad = 0.05
    x1, x2 = max(0.0, min(x1, x2) - pad), min(1.0, max(x1, x2) + pad)
    y1, y2 = max(0.0, min(y1, y2) - pad), min(1.0, max(y1, y2) + pad)
    crop = img[int(y1 * h):int(y2 * h), int(x1 * w):int(x2 * w)]
    s = 1600 / max(crop.shape[:2])
    crop = cv2.resize(crop, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC if s > 1 else cv2.INTER_AREA)
    out = Path(a.out) if a.out else Path(a.image).with_name(f'{Path(a.image).stem}-vung-{int(y1*100)}-{int(y2*100)}.png')
    cv2.imwrite(str(out), crop)
    print(out)


if __name__ == '__main__':
    main()
