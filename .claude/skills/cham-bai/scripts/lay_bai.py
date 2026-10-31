"""Lấy bài cần chấm từ MathShine qua API chấm bài (email-api/api/grading.js).

  python lay_bai.py <đường dẫn chấm bài hoặc Chi tiết bài tập> [--out cham-bai] [--lai]

Với mỗi Lần nộp cần chấm, tạo thư mục <out>/<bài tập>/<học sinh>-lan<N>/ gồm:
  goc-<i>.jpg   ảnh gốc, giữ nguyên độ phân giải, đúng thứ tự học sinh nộp (i = 1, 2, …)
  bai-nop.json  thông tin Lần nộp
  binh-luan.md  bình luận của giáo viên và học sinh theo từng ảnh (+ binh-luan.json, ảnh đính kèm dinh-kem-*.jpg)
Đường dẫn Chi tiết bài tập: API chỉ trả các dòng vàng "Đã nộp"; Lần nộp đã đẩy xong (xong.txt) hoặc có bao-cao.md
kiểu cũ thì bỏ qua; đã chấm (cham.md) mà đẩy chưa xong thì đưa vào dayLai (chỉ cần chạy day_len.py).
Đường dẫn chấm bài (một Lần nộp): luôn chấm, bất kể trạng thái trên MathShine hay đã chấm trên máy. --lai: chấm lại tất cả.
Cũng ghi <out>/<bài tập>/bai-tap.json và <out>/giong-van.md (mẫu nhận xét cũ của giáo viên ra bài).
In ra JSON tóm tắt các thư mục cần chấm.

Khóa: biến môi trường MATHSHINE_GRADING_KEY, file ~/.mathshine-grading-key, hoặc <skill>/khoa.txt.
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

API = os.environ.get('MATHSHINE_GRADING_API', 'https://mathshine-email-api.vercel.app/api/grading')
VOICE_SAMPLES = 12  # mẫu giọng văn: mọi nhận xét chung + các nhận xét theo ảnh dài nhất


def grading_key() -> str:
    key = os.environ.get('MATHSHINE_GRADING_KEY', '').strip()
    # ~/.mathshine-grading-key trên máy giáo viên; <skill>/khoa.txt khi skill được đóng gói kèm khóa (Claude Desktop)
    for f in (Path.home() / '.mathshine-grading-key', Path(__file__).resolve().parent.parent / 'khoa.txt'):
        if not key and f.exists():
            key = f.read_text(encoding='utf-8').strip()
    if not key:
        sys.exit('Thiếu khóa: đặt MATHSHINE_GRADING_KEY, tạo file ~/.mathshine-grading-key, hoặc <skill>/khoa.txt')
    return key


def call(params: dict) -> bytes:
    req = urllib.request.Request(f'{API}?{urllib.parse.urlencode(params)}', headers={'x-grading-key': grading_key()})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return res.read()
    except urllib.error.HTTPError as e:
        sys.exit(f'API lỗi {e.code}: {e.read().decode("utf-8", "replace")}')
    except (urllib.error.URLError, OSError) as e:  # một dòng thay cho cả trang traceback
        sys.exit(f'Lỗi mạng khi gọi {API}: {getattr(e, "reason", e)} (xem cai-dat.md)')


def slug(text: str) -> str:
    s = unicodedata.normalize('NFD', text).replace('đ', 'd').replace('Đ', 'D')
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-').lower()[:60] or 'khong-ten'


def pick_voice(samples: list[dict]) -> list[dict]:
    """Giữ mọi nhận xét chung, thêm các nhận xét theo ảnh dài nhất (bỏ trùng) cho đủ VOICE_SAMPLES, theo thứ tự cũ."""
    seen, unique = set(), []
    for s in samples:
        if s['text'].strip() not in seen:
            seen.add(s['text'].strip())
            unique.append(s)
    general = [s for s in unique if s['kind'] == 'Nhận xét chung']
    rest = sorted((s for s in unique if s['kind'] != 'Nhận xét chung'), key=lambda s: -len(s['text']))
    keep = {id(s) for s in (general + rest)[:VOICE_SAMPLES]}
    return [s for s in unique if id(s) in keep]


def clip(text: str, limit: int = 300) -> str:
    """Mẫu giọng văn chỉ cần đủ để bắt giọng: cắt ở cuối câu gần nhất trước `limit`, không cắt giữa công thức."""
    if len(text) <= limit:
        return text
    for m in reversed(list(re.finditer(r'[.!?](?=\s)', text[:limit]))):
        head = text[:m.end()]
        if head.count('\\(') == head.count('\\)'):
            return head + ' …'
    return text


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
    ap.add_argument('--lai', action='store_true', help='chấm lại cả Lần nộp đã chấm')
    a = ap.parse_args()

    data = json.loads(call({'action': 'list', 'link': a.link}))
    asg = data['assignment']
    root = Path(a.out)
    asg_dir = root / f"{slug(asg['title'])}-{asg['id'][:6]}"
    asg_dir.mkdir(parents=True, exist_ok=True)
    (asg_dir / 'bai-tap.json').write_text(json.dumps(asg, ensure_ascii=False, indent=2), encoding='utf-8')
    # Mẫu giọng văn của chính giáo viên ra bài (API cũ bỏ qua tham số teacher, trả về của mọi giáo viên).
    # Ghi Markdown thay JSON: mọi người chấm đều đọc file này, JSON nhân đôi mọi \ của công thức nên tốn token hơn.
    samples = pick_voice(json.loads(call({'action': 'voice', 'teacher': asg.get('createdBy', '')}))['samples'])
    (root / 'giong-van.md').write_text(
        '# Nhận xét thật của giáo viên (mẫu giọng văn)\n\n'
        + ''.join(f"- [{s['kind'].removeprefix('Nhận xét ')}] {clip(' '.join(s['text'].split()))}\n" for s in samples),
        encoding='utf-8')

    todo, retry, skipped = [], [], []
    # Giáo viên dán thẳng đường dẫn chấm một bài: chấm luôn (ảnh lấy lại từ bản gốc, bình luận cũ được sửa tại chỗ)
    regrade = a.lai or data['scope'] == 'submission'
    for sub in data['submissions']:
        d = asg_dir / f"{slug(sub['studentName'])}-lan{sub['attemptNumber']}"
        if not regrade:
            # Đã đẩy xong, hoặc có báo cáo kiểu cũ mà giáo viên đã tự xử lý: bỏ qua
            if (d / 'xong.txt').exists() or (d / 'bao-cao.md').exists():
                skipped.append(str(d))
                continue
            # Đã chấm (có cham.md) mà đẩy lên chưa xong: chỉ chạy lại day_len.py, không chấm lại
            if (d / 'cham.md').exists():
                retry.append(str(d))
                continue
        d.mkdir(parents=True, exist_ok=True)
        # Lưu nguyên ảnh gốc, không thu nhỏ hay làm nét (giữ đủ độ phân giải để đọc chữ viết tay).
        # Ảnh đã từng đẩy Ảnh đã chấm lên thì trên MathShine là bản có dấu: dùng lại ảnh gốc đã giữ.
        for i, image_id in enumerate(sub['imageIds'], start=1):
            backup = d / f'goc-{i}.ban-dau.jpg'
            (d / f'goc-{i}.jpg').write_bytes(backup.read_bytes() if backup.exists() else call({'action': 'image', 'id': image_id}))
        (d / 'bai-nop.json').write_text(json.dumps(sub, ensure_ascii=False, indent=2), encoding='utf-8')
        n_comments = save_comments(d, sub['submissionId'])
        # Mọi file người chấm cần đọc, để đọc hết trong một lượt; không có bình luận thì khỏi mở binh-luan.md
        files = [f'goc-{i}.jpg' for i in range(1, len(sub['imageIds']) + 1)]
        files += (['binh-luan.md'] + sorted(f.name for f in d.glob('dinh-kem-*.jpg'))) if n_comments else []
        todo.append({'dir': str(d), 'student': sub['studentName'], 'attempt': sub['attemptNumber'],
                     'files': files, 'status': sub['status'], 'gradeUrl': sub['gradeUrl']})

    print(json.dumps({'assignment': asg['title'], 'assignmentDir': str(asg_dir), 'scope': data['scope'],
                      'todo': todo, 'dayLai': retry, 'skippedDone': len(skipped)}, ensure_ascii=False))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
