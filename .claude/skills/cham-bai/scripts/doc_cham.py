"""Đọc cham.md — thứ duy nhất người chấm viết cho một Lần nộp — ra dấu ✓/✘, điểm và bình luận.

cham.md:
  | Câu | Đ/S | Điểm | Tối đa | Vị trí |
  | 7 | ✘ | 0 | 0,25 | 1 (0.60; 0.40) |
  …mỗi câu/ý một dòng; Điểm để trống được với ✓ (đủ điểm) và — (0)…

  ## Ảnh 1
  <đoạn bình luận>          ← mỗi đoạn (cách nhau một dòng trống) là một bình luận của ảnh đó

Vị trí: ảnh (x; y) — chỗ vẽ ✓/✘, tỉ lệ 0–1 theo chiều rộng / chiều cao ảnh.
cham.md cũ còn cột Khoanh thứ 6 thì cột đó bị bỏ qua (giáo viên đã bỏ vòng khoanh).
Dòng "Bình luận: không" (giáo viên chọn không nhận xét): không có mục "## Ảnh", không đăng bình luận nào.
Còn lại, mỗi câu ✘ phải được nhắc tên (vd. "Câu 7", "câu 2, 5, 9a") ở một đoạn nào đó, không bắt buộc dưới ảnh của câu
đó: các câu chỉ ghi đáp số sai được gộp vào một đoạn "cần xem lại" duy nhất.
Bình luận không được có dấu gạch (-, –, —) ngoài công thức \\(…\\): đọc như máy viết.

parse(text, n_images) → (data, problems); problems rỗng là đọc được hết.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from chuan_hoa import fix_text  # noqa: E402

SPOT = re.compile(r'(\d+)\s*\(([^)]*)\)')
NO_COMMENTS = re.compile(r'^Bình luận:\s*không\s*$', re.M | re.I)
FORMULA = re.compile(r'\\\(.*?\\\)', re.S)
DASH = re.compile(r'[-‐‑‒–—―]')


def num(s: str) -> float:
    return float(s.strip().replace(',', '.'))


def fmt(x: float) -> str:
    return f'{round(x, 2):g}'.replace('.', ',')


def spots(cell: str, size: int, cau: str, what: str, n_images: int, problems: list[str]) -> list[tuple]:
    out = []
    for m in SPOT.finditer(cell):
        try:
            vals = [num(v) for v in m[2].split(';')]
        except ValueError:
            vals = []
        if len(vals) != size or not all(0 <= v <= 1 for v in vals) or not 1 <= int(m[1]) <= n_images:
            problems.append(f'câu {cau}: {what} "{m[0]}" sai (ảnh 1–{n_images}, {size} số từ 0 đến 1, cách nhau bằng ;)')
            continue
        out.append((int(m[1]), *vals))
    return out


def parse(text: str, n_images: int) -> tuple[dict, list[str]]:
    problems: list[str] = []
    marks, wrong = [], []
    total = max_total = 0.0
    count = {'✓': 0, '✘': 0, '—': 0}
    for line in text.splitlines():
        if not line.startswith('|') or re.fullmatch(r'[|\s:-]+', line) or line.startswith('| Câu'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) not in (5, 6):
            problems.append(f'dòng bảng cần 5 cột (Câu | Đ/S | Điểm | Tối đa | Vị trí): {line[:60]}')
            continue
        cau, ds, diem, toi_da, pos = cells[:5]
        if ds not in count:
            problems.append(f'câu {cau}: Đ/S phải là ✓, ✘ hoặc —')
            continue
        try:
            toi_da = num(toi_da)
            # Điểm để trống: ✓ là đủ điểm, — là 0; câu ✘ phải ghi điểm
            diem = num(diem) if diem else {'✓': toi_da, '—': 0.0}.get(ds)
            if diem is None:
                raise ValueError
        except ValueError:
            problems.append(f'câu {cau}: điểm không phải số' + (' (câu ✘ phải ghi điểm)' if ds == '✘' else ''))
            continue
        count[ds] += 1
        total, max_total = total + diem, max_total + toi_da
        if ds == '✓' and diem != toi_da:
            problems.append(f'câu {cau}: ✓ phải đủ điểm')
        if ds == '—':
            continue
        at = spots(pos, 2, cau, 'Vị trí', n_images, problems)
        if len(at) != 1:
            problems.append(f'câu {cau}: cần đúng một Vị trí dạng "ảnh (x; y)", vd. 1 (0.62; 0.31)')
            continue
        marks.append({'anh': at[0][0], 'cau': cau, 'dung': ds == '✓', 'x': at[0][1], 'y': at[0][2]})
        if ds == '✘':
            wrong.append(cau)
    if not max_total:
        problems.append('chưa có bảng câu (| Câu | Đ/S | Điểm | Tối đa | Vị trí |)')

    comments = {}
    headings = re.findall(r'^##\s.*$', text, re.M)
    if bad := [h for h in headings if not re.match(r'## Ảnh \d+\b', h)]:
        problems.append('tiêu đề nhận xét phải đúng dạng "## Ảnh <i>": ' + ', '.join(bad))
    for m in re.finditer(r'^## Ảnh (\d+)\b[^\n]*\n(.*?)(?=^## |\Z)', text, re.M | re.S):
        # Giáo viên gõ bình luận không chấm câu ở cuối: bỏ dấu chấm cuối đoạn (giữ dấu "...")
        paras = [re.sub(r'(?<!\.)\.$', '', fix_text(p.replace('**', '').strip(), wrap=False))
                 for p in re.split(r'\n\s*\n', m[2]) if p.strip()]
        if paras:
            comments[int(m[1])] = paras
    if NO_COMMENTS.search(text):
        if comments:
            problems.append('đã ghi "Bình luận: không" thì bỏ hết các mục ## Ảnh <i>')
    else:
        said = FORMULA.sub('', '\n'.join(p for paras in comments.values() for p in paras))
        if missing := [c for c in wrong if not re.search(rf'(?<![\w]){re.escape(c)}(?![\w])', said)]:
            problems.append('câu ✘ chưa được nhắc trong nhận xét (## Ảnh <i>): ' + ', '.join(missing))
    if dashed := sorted(i for i, paras in comments.items() if any(DASH.search(FORMULA.sub('', p)) for p in paras)):
        problems.append('nhận xét ảnh ' + ', '.join(map(str, dashed)) + ' có dấu gạch (-, –, —): viết lại bằng dấu phẩy, '
                        'dấu hai chấm hoặc tách câu; dấu trừ thì đặt trong \\(…\\)')

    data = {'diem': total, 'toiDa': max_total, 'dung': count['✓'], 'sai': count['✘'], 'boTrong': count['—'],
            'dau': marks, 'binhLuan': comments}
    return data, problems


def load(d: Path) -> tuple[dict, list[str]]:
    f = d / 'cham.md'
    if not f.exists():
        return {}, ['chưa có cham.md']
    n_images = sum(1 for g in d.glob('goc-*.jpg') if re.fullmatch(r'goc-\d+\.jpg', g.name))
    return parse(f.read_text(encoding='utf-8'), n_images)
