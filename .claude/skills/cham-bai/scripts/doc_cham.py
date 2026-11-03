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
Còn lại, mỗi ảnh có câu ✘ đúng một đoạn (một bình luận), nhắc tên mọi câu ✘ của ảnh đó (vd. "Câu 1, câu 2 và câu 3
em chưa đúng, em kiểm tra lại nhé"); ảnh của một câu là ảnh ghi ở cột Vị trí.
Nhãn nhiều tầng (P2.II.6b) không được chép nguyên vào bình luận: học sinh đọc "Phần 2 câu 6b" (bỏ mục La Mã),
nhiều câu cùng phần thì "Phần 2 câu 6b, 8a và 8b".
Bình luận không được có dấu gạch (-, –, —) ngoài công thức \\(…\\): đọc như máy viết.

Đối chiếu đề: dòng "Danh sách câu: I.1, I.2, …" của <bài tập>/dap-an.md là mọi câu được chấm (câu ở dòng
"Bỏ không chấm" không có trong đó); bảng phải có đủ và đúng các nhãn đó (câu không làm ghi —), nên câu bị bỏ
không có dấu, không tính điểm, không bị nhắc là còn thiếu.
Lịch sử: Lần nộp <học sinh>-lan<N> được so với cham.md đã lưu của các Lần nộp trước cùng học sinh (lan1 … lan<N-1>),
không chấm lại lần nào: câu đã sửa, chưa sửa, chưa làm lại, mới sai, và câu chưa làm lần nào (còn thiếu).
Có nhận xét thì script tự thêm câu nhắc câu còn thiếu và câu chưa làm lại vào cuối bình luận của ảnh cuối
(người chấm không viết phần này, không cần biết lịch sử).

parse(text, n_images) → (data, problems); problems rỗng là đọc được hết.
load(d) thêm đối chiếu đề và data['lichSu']; history_line(h) là dòng tóm tắt lịch sử cho giáo viên.
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
ATTEMPT = re.compile(r'(.+)-lan(\d+)')
EXAM_LABELS = re.compile(r'^Danh sách câu:\s*(.+)$', re.M)
SUB = re.compile(r'(\d+)([a-z]?)', re.I)


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


def has_word(word: str, text: str) -> bool:
    return bool(re.search(rf'(?<!\w){re.escape(word)}(?!\w)', text, re.I))


def readable(label: str) -> str:
    """Cách gọi câu cho học sinh đọc: P2.II.6b → "Phần 2 câu 6b", II.19a → "câu 19a", 7 → "câu 7"."""
    parts = label.split('.')
    part = re.fullmatch(r'P(\d+)', parts[0], re.I)
    return (f'Phần {part[1]} ' if part and len(parts) > 1 else '') + f'câu {parts[-1]}'


def mentioned(label: str, text: str) -> bool:
    """Câu được nhắc trong đoạn: có số câu (6b), và có "Phần 2" nếu nhãn có phần; nhiều câu cùng phần gọi chung một lần."""
    parts = label.split('.')
    part = re.fullmatch(r'P(\d+)', parts[0], re.I)
    return has_word(parts[-1], text) and (not part or len(parts) == 1 or has_word(f'phần {part[1]}', text))


def and_list(items: list[str]) -> str:
    return ', '.join(items[:-1]) + ' và ' + items[-1] if len(items) > 1 else items[0]


def names(cs: list[str], all_labels: list[str]) -> str:
    """Gọi gọn một nhóm câu cho học sinh: "Phần I câu 6, 7 và 9, Phần III câu 1 đến 5". Thiếu mọi ý a, b, c… của
    một câu thì gọi cả câu; từ ba câu liền nhau thì gọi khoảng."""
    def head(c: str) -> str:
        return c.rsplit('.', 1)[0] if '.' in c else ''

    groups: dict[str, list] = {}
    for c in cs:
        m = SUB.fullmatch(c.split('.')[-1])
        siblings = [x for x in all_labels if head(x) == head(c) and (s := SUB.fullmatch(x.split('.')[-1])) and m
                    and s[1] == m[1]]
        item = int(m[1]) if m and (not m[2] or all(x in cs for x in siblings)) else c.split('.')[-1]
        g = groups.setdefault(c.split('.')[0] if '.' in c else '', [])
        if item not in g:
            g.append(item)
    out = []
    for key, items in groups.items():
        words, i = [], 0
        while i < len(items):
            j = i
            while isinstance(items[i], int) and j + 1 < len(items) and items[j + 1] == items[j] + 1:
                j += 1
            words += [f'{items[i]} đến {items[j]}'] if j - i >= 2 else [str(x) for x in items[i:j + 1]]
            i = j + 1
        part = re.fullmatch(r'P(\d+)', key, re.I)
        prefix = f'Phần {part[1]} ' if part else f'Phần {key} ' if key and len(groups) > 1 else ''
        out.append(f'{prefix}câu {and_list(words)}')
    return ', '.join(out)


def reminder(h: dict, all_labels: list[str]) -> str:
    """Câu nhắc học sinh các câu chưa làm, script tự thêm vào cuối bình luận ảnh cuối."""
    said = []
    if h['conThieu']:
        said.append(f"Em còn {names(h['conThieu'], all_labels)} chưa làm, em làm bổ sung nhé")
    if h['chuaLamLai']:
        s = names(h['chuaLamLai'], all_labels)
        said.append(f'{s[0].upper()}{s[1:]} lần trước em chưa đúng mà lần này em chưa làm lại, em sửa luôn nha')
    return '. '.join(said)


def parse(text: str, n_images: int) -> tuple[dict, list[str]]:
    problems: list[str] = []
    marks, wrong, labels, rows = [], [], [], []
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
        labels.append(cau)
        if ds not in count:
            problems.append(f'câu {cau}: Đ/S phải là ✓, ✘ hoặc —')
            continue
        rows.append((cau, ds))
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
            wrong.append((cau, at[0][0]))
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
        said = {i: FORMULA.sub('', '\n'.join(paras)) for i, paras in comments.items()}
        if missing := [f'câu {c} (ảnh {i}, viết "{readable(c)}")' for c, i in wrong if not mentioned(c, said.get(i, ''))]:
            problems.append('câu ✘ chưa được nhắc trong nhận xét của ảnh có dấu ✘ đó (## Ảnh <i>): ' + ', '.join(missing))
        if raw := sorted({c for c in labels if '.' in c and any(has_word(c, s) for s in said.values())}):
            problems.append('nhận xét còn chép nhãn bảng, học sinh khó đọc: '
                            + ', '.join(f'{c} → "{readable(c)}"' for c in raw))
        if many := sorted(i for i, paras in comments.items() if len(paras) > 1):
            problems.append('mỗi ảnh chỉ một đoạn nhận xét (gộp các câu sai của ảnh vào một đoạn, không để dòng trống): ảnh '
                            + ', '.join(map(str, many)))
    if dashed := sorted(i for i, paras in comments.items() if any(DASH.search(FORMULA.sub('', p)) for p in paras)):
        problems.append('nhận xét ảnh ' + ', '.join(map(str, dashed)) + ' có dấu gạch (-, –, —): viết lại bằng dấu phẩy, '
                        'dấu hai chấm hoặc tách câu; dấu trừ thì đặt trong \\(…\\)')

    data = {'diem': total, 'toiDa': max_total, 'dung': count['✓'], 'sai': count['✘'], 'boTrong': count['—'],
            'dau': marks, 'binhLuan': comments, 'hang': rows, 'coBinhLuan': not NO_COMMENTS.search(text)}
    return data, problems


def exam_labels(d: Path) -> list[str]:
    """Mọi câu của đề, theo dòng "Danh sách câu:" của dap-an.md (cùng thư mục bài tập); không có thì rỗng."""
    f = d.parent / 'dap-an.md'
    m = EXAM_LABELS.search(f.read_text(encoding='utf-8')) if f.exists() else None
    return [c.strip().strip('`') for c in m[1].split(',') if c.strip()] if m else []


def history(d: Path, rows: list[tuple[str, str]]) -> dict:
    """So Lần nộp này với cham.md đã lưu của các Lần nộp trước cùng học sinh; không chấm lại lần nào.
    Mỗi câu lấy kết quả của lần gần nhất có làm câu đó (học sinh hay chỉ nộp lại các câu sai)."""
    m = ATTEMPT.fullmatch(d.name)
    n = int(m[2]) if m else 1
    before, seen, notes, last_wrong = {}, [], [], None
    for k in range(1, n):
        p = d.parent / f'{m[1]}-lan{k}'
        if not (p / 'cham.md').exists():
            notes.append(f'lần {k} ' + ('chấm kiểu cũ, không so được' if (p / 'bao-cao.md').exists() else 'chưa chấm bằng skill'))
            continue
        old = parse((p / 'cham.md').read_text(encoding='utf-8'), 99)[0]['hang']
        seen.append(k)
        last_wrong = {c for c, ds in old if ds == '✘'}
        before.update({c: ds for c, ds in old if ds != '—'})

    def pick(old: str, new: str) -> list[str]:
        return [c for c, ds in rows if before.get(c) == old and ds == new]

    now_wrong = {c for c, ds in rows if ds == '✘'}
    return {'lan': n, 'daSo': seen, 'ghiChu': notes,
            'daSua': pick('✘', '✓'), 'chuaSua': pick('✘', '✘'), 'chuaLamLai': pick('✘', '—'), 'moiSai': pick('✓', '✘'),
            'conThieu': [c for c, ds in rows if ds == '—' and c not in before],
            'trungLanTruoc': seen[-1] if seen and now_wrong and now_wrong == last_wrong else None}


def history_line(h: dict) -> str:
    def part(name: str, cs: list[str]) -> str:
        return f"{name}: {', '.join(cs) if cs else 'không'}"
    if h['daSo']:
        head = f"Lần {h['lan']}, so với lần " + ', '.join(map(str, h['daSo']))
        parts = [part('đã sửa', h['daSua']), part('chưa sửa', h['chuaSua']), part('chưa làm lại', h['chuaLamLai']),
                 part('mới sai', h['moiSai']), part('còn thiếu', h['conThieu'])]
    else:
        head = 'Lần 1' if h['lan'] == 1 else f"Lần {h['lan']}, không có lần trước để so"
        parts = [part('còn thiếu', h['conThieu'])]
    line = 'Lịch sử (' + '; '.join([head] + h['ghiChu']) + '): ' + '; '.join(parts)
    if h['trungLanTruoc']:
        line += (f" · CẢNH BÁO: câu ✘ trùng y lần {h['trungLanTruoc']}, soát lại ảnh gốc các câu ✘"
                 ' (phương án cuối không bị gạch, mực đỏ là của học sinh)')
    return line


def load(d: Path) -> tuple[dict, list[str]]:
    f = d / 'cham.md'
    if not f.exists():
        return {}, ['chưa có cham.md']
    n_images = sum(1 for g in d.glob('goc-*.jpg') if re.fullmatch(r'goc-\d+\.jpg', g.name))
    data, problems = parse(f.read_text(encoding='utf-8'), n_images)
    if labels := exam_labels(d):
        have = [c for c, _ in data['hang']]
        if lack := [c for c in labels if c not in have]:
            problems.append('bảng thiếu câu của đề (mỗi câu trong "Danh sách câu" của dap-an.md một dòng, chưa làm thì ghi —): '
                            + ', '.join(lack))
        if extra := [c for c in have if c not in labels]:
            problems.append('nhãn không có trong "Danh sách câu" của dap-an.md (dùng đúng nhãn đó): ' + ', '.join(extra))
    h = data['lichSu'] = history(d, data['hang'])
    if data['coBinhLuan'] and (note := reminder(h, labels or [c for c, _ in data['hang']])):
        paras = data['binhLuan'].setdefault(max(n_images, 1), [])
        if paras:
            paras[-1] += ('. ' if paras[-1][-1:] not in '.?!' else ' ') + note
        else:
            paras.append(note)
    return data, problems
