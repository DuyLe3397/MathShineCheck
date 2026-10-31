"""Đọc cham.md (doc_cham.py) rồi vẽ ✓/✘ lên ảnh bài làm, ra Ảnh đã chấm để đẩy lên MathShine (docs/adr/0009).
Không khoanh chỗ sai: giáo viên bỏ vòng khoanh, chỗ sai chỉ bằng lời trong bình luận.

  python danh_dau.py <thư mục bài nộp>

Với mỗi ảnh có dấu: vẽ lên ảnh gốc (goc-<i>.ban-dau.jpg nếu đã từng đẩy lên, không thì goc-<i>.jpg) →
  cham-<i>.jpg  cùng kích thước, JPEG vừa giới hạn 900KB của MathShine — bản sẽ đẩy lên;
  xem-<k>.jpg   tấm ghép 2×2 các ảnh đã vẽ (có nhãn "Ảnh i"), để soát vị trí bằng ít lần đọc ảnh nhất.
cham.md sai mẫu: in THIẾU kèm chỗ phải sửa, mã thoát 1. Đúng: in điểm, số ✓/✘ và các tấm ghép cần xem.
"""
import base64
import io
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from doc_cham import fmt, load  # noqa: E402

# Như bút "Vẽ" giáo viên vẫn dùng trên trang chấm bài: màu #ef4444, nét 6px trên ảnh gốc, đầu nét tròn
RED = (239, 68, 68)
STROKE = 6
MAX_DATA_URL = 900000  # như MAX_IMAGE_DATA_URL của email-api/lib/grading.js
CELL = (700, 930)  # mỗi ô của tấm ghép; 2×2 ô vẫn vừa một lần đọc ảnh của Claude


def original(d: Path, i: int) -> Path:
    backup = d / f'goc-{i}.ban-dau.jpg'
    return backup if backup.exists() else d / f'goc-{i}.jpg'


def stroke(draw: ImageDraw.ImageDraw, pts: list[tuple[float, float]]) -> None:
    """Một nét bút STROKE px, đầu nét tròn như lineCap 'round' của canvas."""
    draw.line(pts, fill=RED, width=STROKE, joint='curve')
    r = STROKE / 2
    for px, py in (pts[0], pts[-1]):
        draw.ellipse((px - r, py - r, px + r, py + r), fill=RED)


def draw_mark(draw: ImageDraw.ImageDraw, w: int, h: int, x: float, y: float, correct: bool) -> None:
    s = max(28, round(0.04 * min(w, h)))
    # Dấu nằm ngay bên phải điểm (x, y), không tràn ra ngoài ảnh
    cx = min(max(x * w + s * 0.6, s), w - s)
    cy = min(max(y * h, s), h - s)
    if correct:
        stroke(draw, [(cx - s * 0.5, cy), (cx - s * 0.12, cy + s * 0.42), (cx + s * 0.55, cy - s * 0.5)])
    else:
        r = s * 0.45
        stroke(draw, [(cx - r, cy - r), (cx + r, cy + r)])
        stroke(draw, [(cx - r, cy + r), (cx + r, cy - r)])


def encode_fit(img: Image.Image) -> bytes:
    """JPEG chất lượng cao nhất mà data URL vẫn vừa MAX_DATA_URL; quá thì thu nhỏ dần."""
    while True:
        for q in (92, 88, 80, 70, 60):
            buf = io.BytesIO()
            img.save(buf, 'JPEG', quality=q)
            data = buf.getvalue()
            if len('data:image/jpeg;base64,') + len(base64.b64encode(data)) <= MAX_DATA_URL:
                return data
        img = img.resize((round(img.width * 0.85), round(img.height * 0.85)), Image.LANCZOS)


def label_font() -> tuple[ImageFont.ImageFont, str]:
    """Font có chữ tiếng Việt cho nhãn "Ảnh i"; máy không có thì dùng font mặc định với nhãn không dấu."""
    for name in ('arial.ttf', 'DejaVuSans.ttf', 'LiberationSans-Regular.ttf'):
        try:
            return ImageFont.truetype(name, 36), 'Ảnh'
        except OSError:
            pass
    return ImageFont.load_default(size=36), 'Anh'


def contact_sheets(d: Path, thumbs: list[tuple[int, Image.Image]]) -> list[str]:
    for old in d.glob('xem-*.jpg'):
        old.unlink()
    font, word = label_font()
    names = []
    for k in range(0, len(thumbs), 4):
        group = thumbs[k:k + 4]
        cols = min(2, len(group))
        sheet = Image.new('RGB', (CELL[0] * cols, CELL[1] * ((len(group) + 1) // 2)), 'white')
        for n, (i, t) in enumerate(group):
            x, y = CELL[0] * (n % 2), CELL[1] * (n // 2)
            sheet.paste(t, (x, y))
            ImageDraw.Draw(sheet).text((x + 8, y + 4), f'{word} {i}', fill=(37, 99, 235), font=font)
        name = f'xem-{k // 4 + 1}.jpg'
        sheet.save(d / name, 'JPEG', quality=80)
        names.append(name)
    return names


def main() -> None:
    d = Path(sys.argv[1])
    data, problems = load(d)
    if problems:
        print('THIẾU: ' + '; '.join(problems))
        sys.exit(1)
    for old in d.glob('cham-*.jpg'):
        old.unlink()  # ảnh đã bỏ hết dấu ở lần sửa này thì không đẩy lên nữa
    thumbs = []
    for i in sorted({m['anh'] for m in data['dau']}):
        img = Image.open(original(d, i)).convert('RGB')
        draw = ImageDraw.Draw(img)
        for m in (m for m in data['dau'] if m['anh'] == i):
            draw_mark(draw, img.width, img.height, m['x'], m['y'], m['dung'])
        (d / f'cham-{i}.jpg').write_bytes(encode_fit(img))
        img.thumbnail(CELL)
        thumbs.append((i, img))
    score = f"{fmt(data['diem'])}/{fmt(data['toiDa'])}"
    if abs(data['toiDa'] - 10) > 1e-9 and data['toiDa']:
        score += f" (thang 10: {fmt(data['diem'] * 10 / data['toiDa'])})"
    print(f"OK điểm {score} · {data['dung']} ✓, {data['sai']} ✘, {data['boTrong']} bỏ trống")
    print('Soát: ' + ', '.join(contact_sheets(d, thumbs)))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    main()
