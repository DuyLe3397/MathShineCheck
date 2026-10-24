"""Lấy bài cần chấm từ MathShine qua API chỉ đọc (email-api/api/grading.js) và làm nét ảnh.

  python lay_bai.py <đường dẫn chấm bài hoặc Chi tiết bài tập> [--out cham-bai] [--lai]

Với mỗi Lần nộp cần chấm, tạo thư mục <out>/<bài tập>/<học sinh>-lan<N>/ gồm:
  goc-<i>.jpg   ảnh gốc, đúng thứ tự học sinh nộp (i = 1, 2, …)
  net-<i>.jpg   ảnh đã làm nét nhẹ để đọc
  bai-nop.json  thông tin Lần nộp
  binh-luan.md  bình luận của giáo viên và học sinh theo từng ảnh (+ binh-luan.json, ảnh đính kèm dinh-kem-*.jpg)
Lần nộp đã có bao-cao.md thì bỏ qua (chạy lại là chấm tiếp), trừ khi có --lai.
Cũng ghi <out>/<bài tập>/bai-tap.json và <out>/giong-van.json (mẫu nhận xét cũ của giáo viên).
In ra JSON tóm tắt các thư mục cần chấm.

Khóa: biến môi trường MATHSHINE_GRADING_KEY, hoặc file ~/.mathshine-grading-key.
Địa chỉ API: MATHSHINE_GRADING_API (mặc định https://mathshine-email-api.vercel.app/api/grading).
"""
import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

import cv2
import numpy as np

API = os.environ.get('MATHSHINE_GRADING_API', 'https://mathshine-email-api.vercel.app/api/grading')
MAX_SIDE = 2576  # cạnh dài tối đa Claude đọc không bị thu nhỏ (docs/research/ai-cham-bai-tu-dong.md)


def grading_key() -> str:
    key = os.environ.get('MATHSHINE_GRADING_KEY', '').strip()
    if not key:
        f = Path.home() / '.mathshine-grading-key'
        key = f.read_text(encoding='utf-8').strip() if f.exists() else ''
    if not key:
        sys.exit('Thiếu khóa: đặt MATHSHINE_GRADING_KEY hoặc tạo file ~/.mathshine-grading-key')
    return key


def call(params: dict) -> bytes:
    req = urllib.request.Request(f'{API}?{urllib.parse.urlencode(params)}', headers={'x-grading-key': grading_key()})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return res.read()
    except urllib.error.HTTPError as e:
        sys.exit(f'API lỗi {e.code}: {e.read().decode("utf-8", "replace")}')


def slug(text: str) -> str:
    s = unicodedata.normalize('NFD', text).replace('đ', 'd').replace('Đ', 'D')
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-').lower()[:60] or 'khong-ten'


def sharpen(img: np.ndarray) -> np.ndarray:
    """Làm nét nhẹ: bỏ bóng/đổ màu nền, đẩy nền giấy về trắng, làm sắc nét. Giữ màu (mực xanh/đen/đỏ vẫn phân biệt).

    Không tăng tương phản cục bộ (CLAHE): làm nổi chữ hằn từ mặt sau trang vở. Đẩy điểm trắng xuống 225 thì
    chữ hằn và dòng kẻ nhạt thành trắng, nét bút vẫn giữ.
    """
    h, w = img.shape[:2]
    if max(h, w) > MAX_SIDE:
        s = MAX_SIDE / max(h, w)
        img = cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    # Nền giấy ước lượng bằng làm mờ mạnh sau khi xoá nét chữ; chia cho nền để bỏ bóng tay/điện thoại
    k = max(15, (min(img.shape[:2]) // 25) | 1)
    bg = cv2.medianBlur(cv2.dilate(img, np.ones((7, 7), np.uint8)), k)
    flat = cv2.divide(img, bg, scale=255)
    lut = (np.clip(np.arange(256) / 225, 0, 1) ** 1.3 * 255).astype(np.uint8)
    out = cv2.LUT(flat, lut)
    return cv2.addWeighted(out, 1.5, cv2.GaussianBlur(out, (0, 0), 1.2), -0.5, 0)


def save_comments(d: Path, submission_id: str) -> int:
    """Bình luận theo từng ảnh (giáo viên và học sinh) → binh-luan.json, binh-luan.md; ảnh đính kèm → dinh-kem-<ảnh>-<bình luận>-<k>.jpg."""
    try:
        images = json.loads(call({'action': 'comments', 'submission': submission_id}))['images']
    except SystemExit as e:  # API cũ chưa có action=comments: vẫn chấm được, chỉ thiếu bình luận
        (d / 'binh-luan.md').write_text(f'# Bình luận theo ảnh\n\nKhông lấy được bình luận ({e}).\n', encoding='utf-8')
        return 0
    lines, total = [], 0
    for img in images:
        if not img['comments']:
            continue
        lines.append(f"## Ảnh {img['image']}\n")
        for n, c in enumerate(img['comments'], start=1):
            total += 1
            who = 'Giáo viên' if c['authorRole'] == 'teacher' else 'Học sinh'
            lines.append(f"### {n}. {who} — {c['authorName']} ({c['createdAt'][:16].replace('T', ' ')})\n")
            lines.append((c['content'] or '(không có chữ)') + '\n')
            for k, att in enumerate(c['attachments'], start=1):
                name = f"dinh-kem-{img['image']}-{n}-{k}.jpg"
                (d / name).write_bytes(call({'action': 'commentImage', 'id': att['id']}))
                att['file'] = name
                lines.append(f"- Hình {k}: `{name}`" + (f" — Ghi chú ảnh: {att['note']}" if att['note'] else '') + '\n')
            lines.append('')
    (d / 'binh-luan.json').write_text(json.dumps(images, ensure_ascii=False, indent=2), encoding='utf-8')
    (d / 'binh-luan.md').write_text('# Bình luận theo ảnh\n\n' + ('\n'.join(lines) if lines else 'Chưa có bình luận.\n'), encoding='utf-8')
    return total


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('link')
    ap.add_argument('--out', default='cham-bai')
    ap.add_argument('--lai', action='store_true', help='chấm lại cả Lần nộp đã có báo cáo')
    a = ap.parse_args()

    data = json.loads(call({'action': 'list', 'link': a.link}))
    asg = data['assignment']
    root = Path(a.out)
    asg_dir = root / f"{slug(asg['title'])}-{asg['id'][:6]}"
    asg_dir.mkdir(parents=True, exist_ok=True)
    (asg_dir / 'bai-tap.json').write_text(json.dumps(asg, ensure_ascii=False, indent=2), encoding='utf-8')
    (root / 'giong-van.json').write_text(
        json.dumps(json.loads(call({'action': 'voice'}))['samples'], ensure_ascii=False, indent=2), encoding='utf-8')

    todo, skipped = [], []
    for sub in data['submissions']:
        d = asg_dir / f"{slug(sub['studentName'])}-lan{sub['attemptNumber']}"
        if (d / 'bao-cao.md').exists() and not a.lai:
            skipped.append(str(d))
            continue
        d.mkdir(parents=True, exist_ok=True)
        for i, image_id in enumerate(sub['imageIds'], start=1):
            raw = call({'action': 'image', 'id': image_id})
            (d / f'goc-{i}.jpg').write_bytes(raw)
            img = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
            cv2.imwrite(str(d / f'net-{i}.jpg'), sharpen(img), [cv2.IMWRITE_JPEG_QUALITY, 92])
        (d / 'bai-nop.json').write_text(json.dumps(sub, ensure_ascii=False, indent=2), encoding='utf-8')
        n_comments = save_comments(d, sub['submissionId'])
        todo.append({'dir': str(d), 'student': sub['studentName'], 'attempt': sub['attemptNumber'],
                     'images': len(sub['imageIds']), 'comments': n_comments,
                     'status': sub['status'], 'gradeUrl': sub['gradeUrl']})

    print(json.dumps({'assignment': asg['title'], 'assignmentDir': str(asg_dir), 'scope': data['scope'],
                      'todo': todo, 'skippedHasReport': skipped}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
